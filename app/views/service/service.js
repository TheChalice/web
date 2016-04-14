'use strict';
angular.module('console.service', [
        {
            files: [
                'components/searchbar/searchbar.js',
                'views/service/service.css'
            ]
        }
    ])
.controller('ServiceCtrl', [ '$rootScope', '$scope', '$log', '$state', '$stateParams', 'DeploymentConfig','ReplicationController', 'Route','BackingServiceInstance','GLOBAL', 'Confirm', 'Sort', 'Ws', function ($rootScope, $scope, $log, $state, $stateParams, DeploymentConfig,ReplicationController, Route,BackingServiceInstance,GLOBAL, Confirm, Sort, Ws) {
        //��ҳ
        $scope.grid = {
            page: 1,
            size: 10,
            txt: ''
        };

        $scope.$watch('grid.page', function(newVal, oldVal){
            if (newVal != oldVal) {
                refresh(newVal);
            }
        });

        var refresh = function(page) {
            var skip = (page - 1) * $scope.grid.size;
            $scope.items = $scope.data.items.slice(skip, skip + $scope.grid.size);

            $log.info('$scope.items=-=-=-=-=-=',$scope.items);
        };


        $scope.search = function (key, txt) {
            if (!txt) {
                refresh(1);
                return;
            }
            $scope.items = [];

            txt = txt.replace(/\//g, '\\/');
            var reg = eval('/' + txt + '/');
            angular.forEach($scope.data.items, function(item){
                if (key == 'all') {
                    if (reg.test(item.metadata.name)) {
                        $scope.items.push(item);
                    }
                }
                else if (key == 'metadata.name') {
                    if (reg.test(item.metadata.name)) {
                        $scope.items.push(item);
                    }
                }
                    // else if (key == 'metadata.labels.build') {
                //    if (item.metadata.labels && reg.test(item.metadata.labels.build)) {
                //        $scope.items.push(item);
                //    }
                //}
            else if (key == 'spec.source.git.uri') {
                    if (reg.test(item.route)) {
                        $scope.items.push(item);
                    }
                }
            });
            $scope.grid.total = $scope.items.length;
        };
        var serviceList = function(){
            DeploymentConfig.get({namespace: $rootScope.namespace}, function(data){
                $log.info('serviceList----', data);
                data.items = Sort.sort(data.items, -1);
                $scope.data = data;
                $scope.items = data.items;
                $scope.grid.total = data.items.length;
                RouteList(data.items);
                loadBsi(data.items);
                refresh(1);
                replicationcls($scope.data.items);

            }, function(res) {
                $log.info('serviceList', res);
                //todo ������
            });
        }

        serviceList();

        $scope.refresh = function(){
            serviceList();
        };
    //////pod数
        var replicationcls = function(items){
            $log.info(items)
            var labelSelector = '';
            if (items.length > 0) {
                labelSelector = 'openshift.io/deployment-config.name in (';
                for (var i = 0; i < items.length; i++) {
                    labelSelector += items[i].metadata.name + ','
                }
                labelSelector = labelSelector.substring(0, labelSelector.length - 1) + ')';
            }
            ReplicationController.get({namespace: $rootScope.namespace,labelSelector: labelSelector}, function (data) {
                $log.info("Replicationcontrollers", data);
                $scope.rcs = data;
                $scope.rcMap = {};
                for(var i = 0;i<data.items.length;i++){
                    $scope.rcMap[data.items[i].metadata.name] = data.items[i];
                }
                for(var i = 0;i < items.length;i++){
                    var cTt = items[i].metadata.name +'-'+ items[i].status.latestVersion;
                    items[i].rc = $scope.rcMap[cTt];
                }
                isNormal(items);
                $scope.resourceVersion = data.metadata.resourceVersion;
                    //watchBuilds(data.metadata.resourceVersion);
            });
        }
    ////路由
       var RouteList = function(servicedata){
           Route.get({namespace: $rootScope.namespace}, function (data) {
               $log.info("Route", data);
               $scope.routeMap = {};
               for (var i = 0; i < data.items.length; i++) {
                   $scope.routeMap[data.items[i].spec.to.name] = data.items[i];
               }

               for (var i = 0; i < servicedata.length; i++) {
                   if ($scope.routeMap[servicedata[i].metadata.name]) {
                       servicedata[i].route = $scope.routeMap[servicedata[i].metadata.name];
                   }else{
                       servicedata[i].route = '---'
                   }
               }
           });
       }
        var isNormal = function(servicedata){
            $log.info('servicedata---test',servicedata)
            for(var i = 0;i<servicedata.length;i++){
                if(servicedata[i].rc){
                    if(servicedata[i].rc.spec.replicas == servicedata[i].rc.status.replicas == 0 &&  servicedata[i].spec.replicas > 0 || servicedata[i].rc.spec.replicas == servicedata[i].spec.replicas && servicedata[i].rc.status.replicas == 0){
                        servicedata[i].ismn = '未启动';
                    }else if(servicedata[i].rc.spec.replicas == servicedata[i].spec.replicas && servicedata[i].rc.status.replicas == 0 && servicedata[i].spec.replicas > 0){
                        servicedata[i].ismn = '异常';
                    }else if(servicedata[i].rc.spec.replicas == servicedata[i].rc.status.replicas == servicedata[i].spec.replicas){
                        servicedata[i].ismn = '正常';
                    }else if(servicedata[i].rc.status.replicas < servicedata[i].spec.replicas && servicedata[i].rc.spec.replicas == servicedata[i].spec.replicas){
                        servicedata[i].ismn = '警告';
                    }
                }else{
                    if(servicedata[i].spec.replicas > 0){
                        servicedata[i].ismn = '未启动';
                    }

                }
            }
        }

        var watchRcs = function(resourceVersion){
            Ws.watch({
                api: 'k8s',
                resourceVersion: resourceVersion,
                namespace: $rootScope.namespace,
                type: 'replicationcontrollers',
                name: ''
            }, function(res){
                var data = JSON.parse(res.data);
                $scope.resourceVersion = data.object.metadata.resourceVersion;
                updateRcs(data);
            }, function(){
                $log.info("webSocket start");
            }, function(){
                $log.info("webSocket stop");
                var key = Ws.key($rootScope.namespace, 'replicationcontrollers', '');
                if (!$rootScope.watches[key] || $rootScope.watches[key].shouldClose) {
                    return;
                }
                watchRcs($scope.resourceVersion);
            });
        };
        var updateRcs = function(data){
            if (data.type == 'ADDED') {
                $scope.rcs.items.push([data.object]);
            }else if (data.type == "MODIFIED") {
                angular.forEach($scope.rcs.items, function(item, i){
                    if (item.metadata.name == data.object.metadata.name) {
                        $scope.rcs.items[i] = data.object;
                    }
                });
            }
        }
        $scope.startDc = function(idx){
            //$scope.data.items[idx].spec.replicas = 1;
            if($scope.data.items[idx].status.latestVersion){
                $scope.data.items[idx].status.latestVersion++;
            }else{
                $scope.data.items[idx].status.latestVersion = 1;
            }

            DeploymentConfig.put({namespace: $rootScope.namespace, name: $scope.data.items[idx].metadata.name}, $scope.data.items[idx], function(res){
                $log.info("start dc success", res);
            }, function(res){
                //todo 错误处理
                $log.info("start dc err", res);
            });
        };
        $scope.stopDc = function(idx){
            var thisRc =  $scope.data.items[idx].rc
            thisRc.spec.replicas = 0;
            ReplicationController.put({namespace: $rootScope.namespace, name: thisRc.metadata.name}, thisRc, function(res){
                $log.info("start dc success", res);

            }, function(res){
                //todo 错误处理
                $log.info("start dc err", res);
            });
        };
    /////绑定
    var loadBsi = function(servicedata){
        BackingServiceInstance.get({namespace:$rootScope.namespace},function(res){
            $log.info('BackingServiceInstance',res);

            for(var g = 0;g<servicedata.length;g++){
                for (var i = 0; i < res.items.length; i++) {
                    for (var j = 0; j < res.items[i].spec.binding.length; j++) {
                        if (res.items[i].spec.binding[j].bind_deploymentconfig == servicedata[g].metadata.name) {
                            servicedata[g].bsi = '已绑定';
                        }
                    }
                }
            }
        }, function(res){
            //todo 错误处理
            $log.info("loadBsi err", res);
        })
    }
    $scope.$on('$destroy', function(){
        Ws.clear();
    });

}]);