'use strict';

angular.module('console.build', [
        {
            files: [
                'components/searchbar/searchbar.js',
                'views/build/build.css'
            ]
        }
    ])
    .controller('BuildCtrl', ['ImageStream','deleteSecret','$rootScope', '$scope', '$log', '$state', '$stateParams', 'BuildConfig', 'Build', 'GLOBAL', 'Confirm', 'Sort', 'Ws', function (ImageStream,deleteSecret,$rootScope, $scope, $log, $state, $stateParams, BuildConfig, Build, GLOBAL, Confirm, Sort, Ws) {
        //复制到系统板
        $scope.copyCon = '复制';
        $scope.isCopy = false;
        $scope.copyContent = function(event){
            var e = event.target.previousElementSibling;
            var textInput = document.createElement('input');
            textInput.setAttribute('value', e.textContent)
            textInput.style.cssText = "position: absolute; top:0; left: -9999px";
            document.body.appendChild(textInput);
            textInput.select();
            var success = document.execCommand('copy');
            if (success) {
                //alert('已经复制到粘贴板');
                $scope.copyCon = '已复制';
                $scope.isCopy = true;
            }
        }
        $scope.copyBlur = function(event){
            $scope.copyCon = '复制';
            $scope.isCopy = false;
        }
        //分页
        $scope.grid = {
            page: 1,
            size: GLOBAL.size,
            txt: '',
            changestatus:'全部',
            status:[{name:'全部'},{name:'构建成功'},{name:'构建失败'},{name:'正在构建'}]
        };
        $scope.paixulist = false
        $scope.urlcopy= function (str) {
            $window.copy(str)
            //alert(11)
        }

        $scope.$watch('grid.changestatus', function (n, o) {
            if (n == o) {
                return;
            }
            if (n !== '全部') {
                //console.log('item', $scope.items);
                if (!$scope.paixulist) {
                    $scope.paixulist= angular.copy($scope.data);

                    angular.forEach($scope.paixulist, function (item,i) {
                        //console.log(item);
                        if (item.build) {
                            if (item.build.status.phase === 'Complete') {
                                item.style="构建成功"
                            }else if(item.build.status.phase === 'Running'){
                                item.style='正在构建'
                            }else if(item.build.status.phase === 'Failed'){
                                item.style='构建失败'
                            }else if(item.build.status.phase === 'Pending'){
                                item.style='正在拉取代码'
                            }else if(item.build.status.phase === 'Error'){
                                item.style='构建失败'
                            }
                        }

                    })
                }
                //var itemcopy = angular.copy($scope.items);
                var newitems=[]
                angular.forEach($scope.paixulist, function (item,i) {
                    //console.log(item, n);
                    if (item.style ==n) {
                        newitems.push(item)
                    }
                })

                //console.log(newitems, n);
                $scope.data=angular.copy(newitems);
                refresh(1)
                //$scope.$apply()


            }else {
                $scope.data=angular.copy($scope.paixulist);
                refresh(1)
            }

        });
        $scope.$watch('grid.page', function(newVal, oldVal){
            if (newVal != oldVal) {
                refresh(newVal);
            }
        });

        var refresh = function(page) {
            $(document.body).animate({
                scrollTop: 0
            }, 200);
            var skip = (page - 1) * $scope.grid.size;
            $scope.items = $scope.data.slice(skip, skip + $scope.grid.size);
        };
        $scope.text='您还没有构建代码';
        $scope.buildsearch = function (event) {
            //if (event.keyCode === 13 || event === 'search') {
            console.log($scope.grid.txt);
            if (!$scope.grid.txt) {
                $scope.data = angular.copy($scope.copydata)
                refresh(1);
                $scope.grid.total = $scope.copydata.length;
                $scope.text='您还没有构建代码';
                return;
            }else {
                var iarr = [];
                var str = $scope.grid.txt;
                str = str.toLocaleLowerCase();
                console.log('$scope.copydata', $scope.copydata);
                angular.forEach($scope.copydata, function (item, i) {
                    console.log(item.build);
                    var nstr = item.metadata.name;
                    nstr = nstr.toLocaleLowerCase();
                    if (nstr.indexOf(str) !== -1) {
                        iarr.push(item)
                    }
                    //console.log(repo.instance_data, $scope.grid.txt);
                })
                $scope.isQuery=false;
                if(iarr.length===0){
                    $scope.isQuery=true;
                    $scope.text='没有查询到相关数据';
                    console.log($scope.items.length);
                    console.log(iarr)
                }
                else{
                    $scope.text='您还没有任何代码构建数据，现在就创建一个吧';
                }
                $scope.data=angular.copy(iarr);
                refresh(1);
                // console.log('$scope.data', $scope.data);
                $scope.grid.total = $scope.data.length;
            }
            //}
        }



        //获取buildConfig列表
        var loadBuildConfigs = function() {
            BuildConfig.get({namespace: $rootScope.namespace,region:$rootScope.region}, function(data){
                //$log.info('buildConfigs', data);
                data.items = Sort.sort(data.items, -1); //排序
                //$scope.copydata = angular.copy(data.items);
                $scope.data = data.items;
                $scope.grid.total = data.items.length;
                //console.log('$scope.data', $scope.data);
                refresh(1);
                loadBuilds($scope.data);
            }, function(res) {
                //todo 错误处理
            });
        };

        //根据buildConfig标签获取build列表
        var loadBuilds = function(items){
            var labelSelector = '';
            if (items.length > 0) {
                labelSelector = 'buildconfig in (';
                for (var i = 0; i < items.length; i++) {
                    labelSelector += items[i].metadata.name + ','
                }
                labelSelector = labelSelector.substring(0, labelSelector.length - 1) + ')';
            }
            Build.get({namespace: $rootScope.namespace, labelSelector: labelSelector,region:$rootScope.region}, function (data) {
                //$log.info("builds", data);

                $scope.resourceVersion = data.metadata.resourceVersion;
                watchBuilds(data.metadata.resourceVersion);

                fillBuildConfigs(data.items);
            });
        };

        var watchBuilds = function(resourceVersion){
            Ws.watch({
                resourceVersion: resourceVersion,
                namespace: $rootScope.namespace,
                type: 'builds',
                name: ''
            }, function(res){
                var data = JSON.parse(res.data);
                updateBuildConfigs(data);
            }, function(){
                $log.info("webSocket start");
            }, function(){
                $log.info("webSocket stop");
                var key = Ws.key($rootScope.namespace, 'builds', '');
                if (!$rootScope.watches[key] || $rootScope.watches[key].shouldClose) {
                    return;
                }
                //watchBuilds($scope.resourceVersion);
            });
        };

        var updateBuildConfigs = function(data){
            if (data.type == 'ERROR') {
                $log.info("err", data.object.message);
                Ws.clear();
                //loadBuilds($scope.data.items);
                return;
            }

            $scope.resourceVersion = data.object.metadata.resourceVersion;
            if (data.type == 'ADDED') {

            } else if (data.type == "MODIFIED") {
                angular.forEach($scope.items, function(item, i){
                    if (!item.build) {
                        return;
                    }
                    if (item.build.metadata.name == data.object.metadata.name) {
                        $scope.items[i].build = data.object;
                    }
                });
                // console.log('$scope.items.build.status.phase',$scope.items);
            }
        };

        //填充buildConfig列表
        var fillBuildConfigs = function(items) {
            var buildMap = {};
            for (var i = 0; i < items.length; i++) {
                if (!items[i].metadata.labels) {
                    continue;
                }
                var label = items[i].metadata.labels.buildconfig;
                if (!buildMap[label]) {
                    buildMap[label] = items[i];
                    continue;
                }
                var st = (new Date(items[i].metadata.creationTimestamp)).getTime();
                if ((new Date(buildMap[label].metadata.creationTimestamp)).getTime() < st) {
                    buildMap[label] = items[i];
                }
            }
            angular.forEach($scope.data, function(item){
                var label = item.metadata.name;
                if (!buildMap[label]) {
                    return;
                }
                item.build= buildMap[label];
                //todo 构建类型
            });
            $scope.copydata = angular.copy($scope.data);
            console.log($scope.copydata);

        };

        loadBuildConfigs();
        $scope.reload = function(){
            loadBuildConfigs();

        };
        $scope.refresh = function(){
            loadBuildConfigs();
            $scope.grid.page = 1;
            $state.reload();
        };


        //开始构建
        $scope.startBuild = function(idx) {
            var name = $scope.items[idx].metadata.name;
            var buildRequest = {
                metadata: {
                    name: name
                }
            };
            BuildConfig.instantiate.create({namespace: $rootScope.namespace, name: name,region:$rootScope.region}, buildRequest, function(){
                $log.info("build instantiate success");
                $state.go('console.build_detail', {name: name, from: 'create'})
            }, function(res){
                //todo 错误处理
            });
        };

        $scope.stop = function(idx){
            Confirm.open("提示信息","您确定要终止本次构建吗？").then(function(){
                var build = $scope.items[idx].build;
                build.status.cancelled = true;
                //build.region=$rootScope.region
                Build.put({namespace: $rootScope.namespace, name: build.metadata.name,region:$rootScope.region}, build, function(res){
                    $log.info("stop build success");
                    $scope.items[idx].build = res;
                }, function(res){
                    if(res.data.code== 409){
                        Confirm.open("提示信息","当数据正在New的时候，构建不能停止，请等到正在构建时，再请求停止。");
                    }
                });
            });
        };
        var removeBuilds = function (bcName) {
            if (!bcName) {
                return;
            }
            Build.remove({namespace: $rootScope.namespace, labelSelector: 'buildconfig=' + bcName}, function () {
                $log.info("remove builds of " + bcName + " success");
            }, function (res) {
                $log.info("remove builds of " + bcName + " error");
            });
        };

        var removeIs = function (name) {
            ImageStream.delete({
                namespace: $rootScope.namespace,
                name: name,
                region: $rootScope.region
            }, {}, function (res) {
                //console.log("yes removeIs");
            }, function (res) {
                //console.log("err removeIs");
            })
        }
        var getSourceHost = function (href) {
            var l = document.createElement("a");
            l.href = href;
            return l.hostname;
        };
        //$scope.$watch('items', function (n, o) {
        //        if (n == o) {
        //            return
        //        }
        //
        //
        //
        //}, true);
        /////删除构建
        $scope.deletes = function (bc,idx) {
            var name =bc.metadata.name;
            Confirm.open("删除构建", "您确定要删除构建吗？", "", 'recycle').then(function () {
                BuildConfig.remove({namespace: $rootScope.namespace, name: name,region:$rootScope.region}, {}, function () {
                    $log.info("remove buildConfig success");
                    $scope.items.splice(idx,1);

                    deleteSecret.delete({
                        namespace: $rootScope.namespace,
                        name: "custom-git-builder-" + $rootScope.user.metadata.name + '-' + name,
                        region:$rootScope.region
                    }), {}, function (res) {

                    }
                    removeIs(name);
                    removeBuilds(name);
                    //var host = bc.build.spec.source.git.uri;
                    //if (!$scope.grid.checked) {
                    //    if (getSourceHost(host) === 'github.com') {
                    //        WebhookHubDel.del({
                    //            namespace: $rootScope.namespace,
                    //            build: $stateParams.name,
                    //            user: bc.metadata.annotations.user,
                    //            repo:bc.metadata.annotations.repo
                    //        }, function (item1) {
                    //
                    //        })
                    //    } else {
                    //        WebhookLabDel.del({
                    //            host: 'https://code.dataos.io',
                    //            namespace: $rootScope.namespace,
                    //            build: $stateParams.name,
                    //            repo: $scope.data.metadata.annotations.repo
                    //        }, function (data2) {
                    //
                    //        });
                    //    }
                    //}
                    //$state.go("console.build");
                }, function (res) {
                    //todo 错误处理
                });
            });
        };

        $scope.$on('$destroy', function(){
            Ws.clear();
        });
    }]);
