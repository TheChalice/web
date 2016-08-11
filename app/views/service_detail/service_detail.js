'use strict';
angular.module('console.service.detail', [
      'kubernetesUI',
      {
        files: [
          'views/service_detail/service_detail.css',
          'components/datepick/datepick.js',
          'components/checkbox/checkbox.js'
        ]
      }
    ])
    .controller('ServiceDetailCtrl', ['$sce','ansi_ups','$http','$state', '$rootScope', '$scope', '$log', '$stateParams', 'DeploymentConfig', 'ReplicationController', 'Route', 'BackingServiceInstance', 'ImageStream', 'ImageStreamTag', 'Toast', 'Pod', 'Event', 'Sort', 'Confirm', 'Ws', 'LogModal', 'ContainerModal', 'Secret', 'ImageSelect', 'Service', 'BackingServiceInstanceBd','ImageService','serviceaccounts','ChooseSecret','$base64','secretskey',
      function ($sce,ansi_ups,$http,$state, $rootScope, $scope, $log, $stateParams, DeploymentConfig, ReplicationController, Route, BackingServiceInstance, ImageStream, ImageStreamTag, Toast, Pod, Event, Sort, Confirm, Ws, LogModal, ContainerModal, Secret, ImageSelect, Service, BackingServiceInstanceBd,ImageService,serviceaccounts,ChooseSecret,$base64,secretskey) {
    //获取服务列表
        $scope.servicepoterr = false;
        
        // console.log('$rootScope',$rootScope);
        $scope.grid = {
          ports: [],
          port: 0,
          host: '',
          suffix: '.'+$rootScope.namespace+'.app.dataos.io',
          isimageChange : true
        };
        var getserviceaccounts = function(){
          serviceaccounts.get({namespace:$rootScope.namespace},function(res){
            $scope.serviceas = res
            //console.log('----------------------',res);
          })
        }
        getserviceaccounts();
        $scope.portMap = {};
        
        var loglast= function () {
          setTimeout(function () {
            $('#sc').scrollTop(1000000)
          },200)
        }
        
        $scope.service = {
          "kind": "Service",
          "apiVersion": "v1",
          "metadata": {
            "name": "",
            "labels": {
              "app": ""
            },
            annotations : {
              "dadafoundry.io/create-by" : $rootScope.user.metadata.name
              // "dadafoundry.io/create-by" : $rootScope.namespace
            }
          },
          "spec": {
            "ports": [],
            "selector": {
              "app": "",
              "deploymentconfig": ""
            },
            //"portalIP": "172.30.189.230",
            //"clusterIP": "172.30.189.230",
            "type": "ClusterIP",
            "sessionAffinity": "None"
          }
        };
        
        var iscreatesv = false;
        
        var getEnvs = function (containers) {
          $scope.envs = [];
          for (var i = 0; i < containers.length; i++) {
            var envs = containers[i].env || [];
            for (var j = 0; j < envs.length; j++) {
              if (!inEnvs(envs[j].name)) {
                $scope.envs.push(envs[j]);
              }
            }
          }
        };

        var inEnvs = function (name) {
          for (var i = 0; i < $scope.envs.length; i++) {
            if ($scope.envs[i].name == name) {
              return true;
            }
          }
          return false;
        };

        var getIst = function (name) {
          var triggers = $scope.dc.spec.triggers || [];
          for (var j = 0; j < triggers.length; j++) {
            if (triggers[j].type == "ImageChange") {
              if (triggers[j].imageChangeParams.containerNames.indexOf(name) != -1) {
                return triggers[j].imageChangeParams.from.name;
              }
            }
          }
          return null;
        };

        var loadDc = function (name) {
          DeploymentConfig.get({namespace: $rootScope.namespace, name: name}, function (res) {
            // $log.info("deploymentConfigs", res);
            if(!res.metadata.annotations){
              res.metadata.annotations = {};
            }
            $scope.dc = res;
            $scope.onlyDC = res;
            $scope.secretsobj = {

              secretarr : []
              ,

              configmap : []
              ,

              persistentarr : []

            }
            var allvolumeMounts = [];
            for(var i = 0 ; i < res.spec.template.spec.containers.length;i++){
              var coni = res.spec.template.spec.containers[i];
              if(coni.volumeMounts){
                allvolumeMounts = allvolumeMounts.concat(coni.volumeMounts);
              }
            }
            if(res.spec.template.spec.volumes){
              var vols = res.spec.template.spec.volumes
              for(var j = 0 ;j<vols.length;j++){
                for(var k = 0 ; k < allvolumeMounts.length; k++){
                   if(allvolumeMounts[k].name == vols[j].name){
                     vols[j].mountPath = allvolumeMounts[k].mountPath;
                   }
                }
                if(vols[j].secret){
                  $scope.secretsobj.secretarr.push({
                    "myname": vols[j].name,
                    "secret": {
                      "secretName":vols[j].secret.secretName
                    },
                    mountPath : vols[j].mountPath
                  })
                }else if(vols[j].configMap){
                  $scope.secretsobj.configmap.push({
                    "myname": vols[j].name,
                    "configMap": {
                      "name":vols[j].configMap.name
                    },
                    mountPath : vols[j].mountPath
                  })

                }else if(vols[j].persistentVolumeClaim){
                  $scope.secretsobj.persistentarr.push({
                    "myname": vols[j].name,
                    "persistentVolumeClaim": {
                      "claimName":vols[j].persistentVolumeClaim.claimName
                    },
                    mountPath : vols[j].mountPath
                  })
                }
              }
            }


            //console.log('$scope.secretsobj$scope.secretsobj$scope.secretsobj',$scope.secretsobj);


            if(res.metadata.annotations){
              if(res.metadata.annotations["dadafoundry.io/images-from"]){
                if(res.metadata.annotations["dadafoundry.io/images-from"] == 'private'){
                  if(res.spec.triggers.length>1){
                    $scope.grid.imageChange = true;
                  }
                  $scope.grid.isimageChange = true;

                }else{
                  $scope.grid.isimageChange = false;
                }
              }
            }
            var r = /^(image-)/;
            for (var i = 0; i < res.spec.template.spec.containers.length; i++) {
              var imagetag = 'image-'+res.spec.template.spec.containers[i].name;
              angular.forEach(res.metadata.annotations,function(v,k){
                if(r.test(k)){
                  if(k != imagetag){
                    delete res.metadata.annotations[k];
                  }
                }
              })
              if (!res.spec.template.spec.containers[i].ports) {
                res.spec.template.spec.containers[i].ports = [{
                  //conflict: false,
                  containerPort: '',
                  //open: false,
                  protocol: "",
                  hostPort: ''
                }]
              }

            }

            $scope.getdc = angular.copy(res);
            getEnvs(res.spec.template.spec.containers);
            angular.forEach($scope.dc.spec.triggers, function (trigger) {
              if(res.metadata.annotations){
                if (trigger.type == 'ImageChange' && res.metadata.annotations["dadafoundry.io/images-from"] == 'public') {
                  $scope.grid.imageChange = true;
                }
              }
              if (trigger.type == 'ConfigChange') {
                $scope.grid.configChange = true;
              }
            });

            //var volumeMap = {};
            //// console.log('secretName',res.spec.template.spec.volumes[0].secret);
            //if (res.spec.template.spec.volumes) {
            //  for (var i = 0; i < res.spec.template.spec.volumes.length; i++) {
            //    if (res.spec.template.spec.volumes[i].secret) {
            //      volumeMap[res.spec.template.spec.volumes[i].name] = res.spec.template.spec.volumes[i].secret.secretName;
            //    }
            //  }
            //  // console.log('volumeMap',$.isEmptyObject(volumeMap));
            //  if ($.isEmptyObject(volumeMap)) {
            //    // console.log(res.spec.template.spec.containers[0]);
            //
            //    if (!res.spec.template.spec.containers[0].volumeMounts) {
            //      res.spec.template.spec.containers[0].volumeMounts=[];
            //    }
            //    $scope.savend =angular.copy(res.spec.template.spec.containers[0].volumeMounts);
            //    res.spec.template.spec.containers[0].volumeMounts=[];
            //
            //  }
            //}
            //angular.forEach($scope.dc.spec.template.spec.containers, function (item) {
            //  angular.forEach(item.volumeMounts, function (volume) {
            //    if (volumeMap[volume.name]) {
            //      volume.name = volumeMap[volume.name];
            //    }
            //  });
            //  if (!item.volumeMounts || item.volumeMounts.length == 0) {
            //    item.volumeMounts = [{}];
            //  }
            //});
            for(var i = 0 ;i < $scope.dc.spec.template.spec.containers.length; i++){
              var imagetag = 'image-'+$scope.dc.spec.template.spec.containers[i].name;
              angular.forEach($scope.dc.metadata.annotations,function(v,k){
                if(r.test(k)){
                  if(k != imagetag){
                    //console.log('cacacacacacaca',k);
                    //console.log('$scope.dc.metadata.annotations[k]',$scope.dc.metadata.annotations[k]);
                    delete $scope.dc.metadata.annotations[k];
                  }
                }
              })
              if($scope.dc.metadata.annotations && $scope.dc.metadata.annotations[imagetag]){
                $scope.dc.spec.template.spec.containers[i].tag = $scope.dc.metadata.annotations[imagetag];
              }else{
                angular.forEach($scope.dc.spec.template.spec.containers, function (item) {
                  var tagstr = item.image;
                  if(tagstr.indexOf('@') != -1){
                    item.tag = tagstr.split('@')[1];
                  }else{
                    item.tag = tagstr.split(':')[1];
                  }
                });
              }
            }
            loadRcs(res.metadata.name);
            loadRoutes();
            loadBsi($scope.dc.metadata.name);
            loadPods(res.metadata.name);
            loadService(res.metadata.name);
            //isConflict();   //判断端口是否冲突

          }, function (res) {
            //todo 错误处理
          });
        };

        var updatePorts = function (containers) {
          angular.forEach(containers, function (item) {
            angular.forEach(item.ports, function (port) {
              port.hostPort = $scope.portMap[port.containerPort + ''] || port.containerPort;
              port.open = !!$scope.portMap[port.containerPort];
            });
          });
        };

        var loadService = function (dc) {
          Service.get({namespace: $rootScope.namespace, name: dc}, function (res) {
            // $log.info("service-=-=-=-=-=-=-=-", res);
            $scope.service = res;

            for (var i = 0; i < res.spec.ports.length; i++) {
              var port = res.spec.ports[i];
              $scope.portMap[port.targetPort + ''] = port.port;

            }
            for(var i = 0 ; i < $scope.dc.spec.template.spec.containers.length;i++){
              //if($scope.dc.spec.template.spec.containers[i].ports){
                 $scope.dc.spec.template.spec.containers[i].ports = [];
              //}
            }

            for(var i = 0 ; i < $scope.dc.spec.template.spec.containers.length;i++){
              for(var j = 0 ; j < res.spec.ports.length ; j++ ){
                var pObj = {
                  containerPort: res.spec.ports[j].targetPort,
                  protocol: res.spec.ports[j].protocol,
                  hostPort: res.spec.ports[j].port
                }
                $scope.dc.spec.template.spec.containers[i].ports.push(pObj);
              }
            }
            $scope.portsArr = [];
              for(var j  = 0; j < $scope.dc.spec.template.spec.containers[0].ports.length; j++ ){
                $scope.portsArr.push($scope.dc.spec.template.spec.containers[0].ports[j])   ;
              }

            // console.log("_+_+_+_+_+ $scope.portsArr",$scope.portsArr);
            //updatePorts($scope.dc.spec.template.spec.containers);
            iscreatesv = true;

          }, function (res) {
            iscreatesv = false;
            // $log.info("load service err", res);
            $scope.portsArr = [{
              containerPort: "",
              protocol: "",
              hostPort: "",
            }]
            updatePorts($scope.dc.spec.template.spec.containers);
          });
        };

        $scope.getupdatePorts = function () {
          $scope.grid.ports = [];
          angular.forEach($scope.dc.spec.template.spec.containers, function (item) {
            angular.forEach(item.ports, function (port) {
              if ($scope.grid.ports.indexOf(port.hostPort) == -1) {
                $scope.grid.ports.push(port.hostPort);
              }
            });
          });
        };

        var isConflict = function () {
          var conflict = false;
          var serviceConflict = false;
          for (var i = 0; i < $scope.portsArr.length; i++) {
            $scope.portsArr[i].conflict=false;
            $scope.portsArr[i].serviceConflict=false;
          }
          //var containers = $scope.portsArr;
          //for (var i = 0; i < containers.length; i++) {
          var ports = $scope.portsArr;
          for (var j = 0; j < ports.length; j++) {
            conflict = portConflict(ports[j].containerPort,j, 'containerPort');
            serviceConflict = portConflict(ports[j].hostPort,j, 'hostPort');

            if (conflict) {
              for (var k = 0; k < conflict.length; k++) {
                ports[conflict[k]].conflict=true
              }
              ports[j].conflict = true;
            }else {
              ports[j].conflict=false
            }
            if (serviceConflict) {
              for (var k = 0; k < serviceConflict.length; k++) {
                ports[serviceConflict[k]].serviceConflict=true
              }
              ports[j].serviceConflict = true;
            }else {
              ports[j].serviceConflict=false
            }


            if (ports[j].containerPort && ports[j].hostPort) {

              $scope.grid.servicepot = false;
              $scope.grid.conflict = conflict;
              $scope.grid.serviceConflict = serviceConflict;
              if (j == ports.length - 1) {
                return conflict || serviceConflict;
              }
            }else if (!ports[j].containerPort && !ports[j].containerPort) {
              return false
            } else {

              $scope.grid.servicepot = true;
              return true
            }
          }
          //}



          // console.log('ports', ports.containerPort)
          // return conflict || serviceConflict;
        };

        var portConflict = function (port,y, tp) {
          //var containers = $scope.portsArr;
          //for (var i = 0; i < containers.length; i++) {
          var ports = $scope.portsArr;
          var arr =[];
          for (var j = 0; j < ports.length; j++) {
            if (j != y) {
              if (tp == 'containerPort' && ports[j].containerPort == port) {
                arr.push(j)
              }
              if (tp == 'hostPort' && ports[j].hostPort == port) {
                arr.push(j)
              }
            }
            if(j==ports.length-1){
              if (arr.length > 0) {
                return arr;
              }
            }
          }

          return false;
        };


        loadDc($stateParams.name);

        var serviceState = function () {
          if ($scope.dc.spec.replicas == 0) {
            return 'ready'; //未启动
          }
          if ($scope.dc.status.replicas == 0) {
            return 'ready'; //未启动
          }
          if ($scope.dc.status.replicas == 0) {
            return 'abnormal';  //异常
          }
          if ($scope.dc.status.replicas == $scope.dc.spec.replicas) {
            return 'normal';    //正常
          }
          return 'warning';   //告警
        };
        
        $scope.$watch('dc.status.replicas',function (n,o) {
          // $scope.$watch('dc.spec.replicas',function (w,t) {
          //   console.log(n == w)
            if ($scope.dc) {
              if (n == 0) {
                $scope.dc.state ='ready'; //未启动
              }
              if (n == 0) {
                $scope.dc.state ='ready'; //未启动
              }
              if (n == 0) {
                $scope.dc.state ='abnormal';  //异常
              }
              if (n == $scope.dc.spec.replicas) {
                $scope.dc.state ='normal';    //正常
              }
            }

            // $scope.dc.state ='warning';   //告警
          })

        // })

        var loadRcs = function (name,oldname) {
          var labelSelector = 'openshift.io/deployment-config.name=' + name;
          ReplicationController.get({namespace: $rootScope.namespace, labelSelector: labelSelector}, function (res) {
            // $log.info("replicationControllers", res);
            res.items = Sort.sort(res.items, -1);
            for (var i = 0; i < res.items.length; i++) {
              res.items[i].dc = JSON.parse(res.items[i].metadata.annotations['openshift.io/encoded-deployment-config']);
              if (res.items[i].metadata.name == $scope.dc.metadata.name + '-' + $scope.dc.status.latestVersion) {
                //$scope.dc.status.replicas = res.items[i].status.replicas;
                $scope.dc.status.phase = res.items[i].metadata.annotations['openshift.io/deployment.phase'];
              }
              if (res.items[i].metadata.annotations['openshift.io/deployment.cancelled'] == 'true') {
                res.items[i].metadata.annotations['openshift.io/deployment.phase'] = 'Cancelled';
              }
            }
            $scope.dc.state = serviceState();

            $scope.resourceVersion = res.metadata.resourceVersion;
            
            if (oldname) {
              //console.log('shoulog',oldname);
              angular.forEach($scope.rcs.items, function (item, i) {
                // console.log(item.metadata.name, oldname);
                if (item.metadata.name == oldname) {
                  item.showLog = true;
                }
              });
            }else {
              $scope.rcs = res;
            }
            $scope.rcs.items[0].showLog=true;
            watchRcs(res.metadata.resourceVersion);
          }, function (res) {
            //todo 错误处理
          });
        };

        var loadRoutes = function () {
          Route.get({namespace: $rootScope.namespace}, function (res) {
            // $log.info("routes", res);
            $scope.getroutes = res;

            for (var i = 0; i < res.items.length; i++) {
              if (res.items[i].spec.to.kind != 'Service') {
                continue;
              }
              //console.log("$scope.dc.metadata.name--0-0-0-0",$scope.dc.metadata.name);
              //console.log("res.items[i].spec.to.name--0-0-0-0",res.items[i].spec.to.name);
              if (res.items[i].spec.to.name == $scope.dc.metadata.name) {
                $scope.dc.route = res.items[i];
                $scope.grid.route = true;
                if($scope.dc.route.spec.port){
                  $scope.grid.port = parseInt($scope.dc.route.spec.port.targetPort.replace(/-.*/, ''));
                }
                $scope.grid.host = $scope.dc.route.spec.host.replace($scope.grid.suffix, '');

              }
            }
          }, function (res) {
            //todo 错误处理
            // $log.info("loadRoutes err", res);
          });
        };

        var loadBsi = function (dc) {
          BackingServiceInstance.get({namespace: $rootScope.namespace}, function (res) {
            // $log.info("backingServiceInstance", res);

            for (var i = 0; i < res.items.length; i++) {
              if (!res.items[i].spec.binding) {
                continue;
              }
              for (var j = 0; j < res.items[i].spec.binding.length; j++) {
                if (res.items[i].spec.binding[j].bind_deploymentconfig == dc) {
                  res.items[i].bind = true;
                }
              }
            }

            $scope.bsi = res;

          }, function (res) {
            //todo 错误处理
            // $log.info("loadBsi err", res);
          });
        };
                                                                                         
        var watchRcs = function (resourceVersion) {
          Ws.watch({
            api: 'k8s',
            resourceVersion: resourceVersion,
            namespace: $rootScope.namespace,
            type: 'replicationcontrollers',
            name: ''
          }, function (res) {
            var data = JSON.parse(res.data);
            updateRcs(data);
          }, function () {
            $log.info("webSocket startRC");
          }, function () {
            $log.info("webSocket stopRC");
            var key = Ws.key($rootScope.namespace, 'replicationcontrollers', '');
            if (!$rootScope.watches[key] || $rootScope.watches[key].shouldClose) {
              return;
            }
            watchRcs($scope.resourceVersion);
          });
        };
        //执行log
        var updateRcs = function (data) {

          console.log('data.type',data.type);
          DeploymentConfig.get({namespace: $rootScope.namespace, name: $stateParams.name}, function (dcdata) {
            //$scope.dc = dcdata
            $scope.getdc.spec.replicas = dcdata.spec.replicas;
            for(var i = 0 ;i < dcdata.spec.template.spec.containers.length; i++){
              var imagetag = 'image-'+dcdata.spec.template.spec.containers[i].name;
              if(dcdata.metadata.annotations && dcdata.metadata.annotations[imagetag]){
                dcdata.spec.template.spec.containers[i].tag = dcdata.metadata.annotations[imagetag];
              }else{
                angular.forEach(dcdata.spec.template.spec.containers, function (item) {
                  var tagstr = item.image;
                  if(tagstr.indexOf('@') != -1){
                    item.tag = tagstr.split('@')[1];
                  }else{
                    item.tag = tagstr.split(':')[1];
                  }
                });
              }
            }

            //console.log('url',dcdata);
            loadService(dcdata.metadata.name);
            $scope.dc = dcdata;
            loadRoutes()

            var labelSelector = 'openshift.io/deployment-config.name=' + $scope.dc.metadata.name;
            ReplicationController.get({namespace: $rootScope.namespace, labelSelector: labelSelector}, function (res) {
              res.items = Sort.sort(res.items, -1);
              for (var i = 0; i < res.items.length; i++) {
                res.items[i].dc = JSON.parse(res.items[i].metadata.annotations['openshift.io/encoded-deployment-config']);
                if (res.items[i].metadata.name == $scope.dc.metadata.name + '-' + $scope.dc.status.latestVersion) {
                  //$scope.dc.status.replicas = res.items[i].status.replicas;
                  $scope.dc.status.phase = res.items[i].metadata.annotations['openshift.io/deployment.phase'];
                }
              }
            })
            for (var i = 0; i < $scope.getroutes.items.length; i++) {
              if ($scope.getroutes.items[i].spec.to.kind != 'Service') {
                continue;
              }
              if ($scope.getroutes.items[i].spec.to.name == $scope.dc.metadata.name) {
                $scope.dc.route = $scope.getroutes.items[i];
                $scope.grid.route = true;
                if($scope.dc.route&&$scope.dc.route.spec.port){
                  $scope.grid.port = parseInt($scope.dc.route.spec.port.targetPort.replace(/-.*/, ''));

                }
                if ($scope.dc.route) {
                  $scope.grid.host = $scope.dc.route.spec.host.replace($scope.grid.suffix, '');
                }


              }
            }
            // console.log('执行了');

            loadPods($scope.dc.metadata.name);
            if (data.type == 'ERROR') {
              $log.info("err", data.object.message);
              Ws.clear();
              //TODO直接刷新rc会导致页面重新渲染
              // if (!$scope.test) {
              //console.log('data.object.metadata.name',data)
              loadRcs($scope.dc.metadata.name,$scope.baocuname);

              // }
              //暂定处理
              return;
            }
            $scope.resourceVersion = data.object.metadata.resourceVersion;
            $scope.dc.status.phase = data.object.metadata.annotations['openshift.io/deployment.phase'];
            $scope.dc.state = serviceState();
            // console.log("$scope.dc+_+_+_+_+", $scope.dc);
            data.object.dc = JSON.parse(data.object.metadata.annotations['openshift.io/encoded-deployment-config']);
            if (data.object.metadata.name == $scope.dc.metadata.name + '-' + $scope.dc.status.latestVersion) {
              //$scope.dc.status.replicas = data.object.status.replicas;
              //$scope.getdc.spec.replicas = data.object.spec.replicas;
            }
            if (data.object.metadata.annotations['openshift.io/deployment.cancelled'] == 'true') {
              data.object.metadata.annotations['openshift.io/deployment.phase'] = 'Cancelled';
            }
          })
            DeploymentConfig.log.get({namespace: $rootScope.namespace, name: $scope.dc.metadata.name}, function (res) {
              $rootScope.lding = false;
              var result = "";
              for (var k in res) {
                if (/^\d+$/.test(k)) {
                  result += res[k];
                }
              }
              if (result == '') {
                result=$scope.test
              }else {
                $scope.test =result
              }
              var html = ansi_ups.ansi_to_html(result);
              //var result = ansi_ups.open().ansi_to_html(result);
              //alert(11111)
              //console.log(html);
              //o.log = $sce.trustAsHtml(html);
              loglast()
              data.object.log = $sce.trustAsHtml(html);
            }, function (res) {
              //todo 错误处理
              if (res.data) {
                data.object.log = res.data.message;
              }

            });

            if (data.type == 'ADDED') {
              //data.object.showLog=true
              //angular.forEach($scope.rcs.items, function (item, i) {
              //  if (item.metadata.name == data.object.metadata.name) {
              //    // console.log('data.object',data.object)
              //    $scope.rcs.items[i].showLog=true;
              //    //data.object.showLog = item.showLog;
              //  }
              //});
              //data.object.showLog = true;
              $rootScope.lding = false;
              data.object.showLog = true;
              if ($scope.rcs.items.length > 0) {
                $scope.rcs.items.unshift(data.object);
              } else {
                $scope.rcs.items = [data.object];
              }
              //if ($scope.rcs.items.length > 0) {
              //  $scope.rcs.items.unshift(data.object);
              //} else {
              //  $scope.rcs.items = [data.object];
              //}
            } else if (data.type == "MODIFIED") {
              //data.object.showLog = true;
              // console.log('RC',$scope.rcs.items)
              $scope.baocuname=data.object.metadata.name;
              //angular.forEach($scope.rcs.items, function (item, i) {
              //  if (item.metadata.name == data.object.metadata.name) {
              //    //if (item.metadata.annotations['openshift.io/deployment-config.latest-version'] == data.object.metadata.annotations['openshift.io/deployment-config.latest-version']) {
              //    data.object.showLog=$scope.rcs.items[i].showLog
              //      // console.log('data.object',data.object)
              //    //$scope.rcs.items[i].showLog=true;
              //    //data.object.showLog = item.showLog;
              //    $scope.rcs.items[i] = data.object;
              //
              //  }
              //});
              angular.forEach($scope.rcs.items, function(item, i){
                if (item.metadata.name == data.object.metadata.name) {
                  data.object.showLog = item.showLog;
                  $scope.rcs.items[i] = data.object;
                }
              });
            }

        };
        
        var statos = {
          start:true,
          dianj:false,
          repeat:null,
        }
        
        $scope.$watch('dc.state',function (n,o) {

          //console.log('new',n);

          if (n != 'normal') {
            $scope.startBtn = {
              name:'启动',
              dianlz:false,
              dianl:true
            }
            //console.log(statos)
            if (!statos.start&&statos.dianj&&statos.repeat=='stop') {
              Toast.open('服务已停止');
              statos.repeat=null;
            }else {
              statos.start=false
            }


          }else {
            $scope.stopBtn = {
              name:'停止',
              dianlz:false,
              dianl:true
            }

            if (!statos.start&&statos.dianj&&statos.repeat=='start') {
              Toast.open('服务已启动');
              statos.repeat=null;
            }else {
              statos.start=false
            }
          }

        })

        $scope.startDc = function () {
          statos.dianj=true;
          statos.repeat='start';
          $scope.startBtn = {
            name:'启动中',
            dianlz:true,
            dianl:false
          }
          
          if ($scope.dc.spec.replicas == 0) {
            $scope.dc.spec.replicas = 1;
            $scope.dc.status.latestVersion = 2;
            $scope.updateDc();
            return;
            
          }

          var rcName = $scope.dc.metadata.name + '-' + $scope.dc.status.latestVersion;
          var items = $scope.rcs.items;
          var item = null;
          for (var i = 0; i < items.length; i++) {
            if (rcName == items[i].metadata.name) {
              item = items[i]
            }
          }
          if (item) {
            item.spec.replicas = $scope.dc.spec.replicas;
            ReplicationController.put({
              namespace: $rootScope.namespace,
              name: item.metadata.name
            }, item, function (res) {
              // $log.info("$scope.dc0-0-0-0-0-0-", $scope.dc);
              // $log.info("start dc success", res);
              item = res;
            }, function (res) {
              //todo 错误处理
              // $log.info("start rc err", res);
            });
          } else {
            //todo 没有rc怎么办?
          }
        };
        
        $scope.stopBtn = {
          name:'停止',
          dianlz:false,
          dianl:true
        }

        $scope.stopDc = function () {
          statos.repeat='stop';
          statos.dianj=true;
          $scope.stopBtn = {
            name:'停止中',
            dianlz:true,
            dianl:false
          }
          var rcName = $scope.dc.metadata.name + '-' + $scope.dc.status.latestVersion;
          var items = $scope.rcs.items;
          var item = null;
          for (var i = 0; i < items.length; i++) {
            if (rcName == items[i].metadata.name) {
              item = items[i]
            }
          }
          if (item) {
            item.spec.replicas = 0;
            ReplicationController.put({
              namespace: $rootScope.namespace,
              name: item.metadata.name
            }, item, function (res) {
              // $log.info("start dc success", res);
              item = res;
              // $log.info("$scope.dc0-0-0-0-0-0-", $scope.dc);

            }, function (res) {
              //todo 错误处理
              // $log.info("start rc err", res);
            });
          }
        };

        $scope.startRc = function (idx) {
          var o = $scope.rcs.items[idx];
          if (!o.dc) {
            return;
          }
          DeploymentConfig.get({namespace: $rootScope.namespace, name: $stateParams.name}, function (dcdata) {
            o.dc.metadata.resourceVersion = dcdata.metadata.resourceVersion;
            o.dc.status.latestVersion = dcdata.status.latestVersion + 1;
            DeploymentConfig.put({namespace: $rootScope.namespace, name: o.dc.metadata.name}, o.dc, function (res) {
              // $log.info("start rc success", res);

            }, function (res) {
              //todo 错误处理
              // $log.info("start rc err", res);
            });
          }, function (res) {
            //todo 错误处理

          })

        };

        $scope.stopRc = function (idx) {
          var o = $scope.rcs.items[idx];
          Confirm.open("终止部署", "您确定要终止本次部署吗?", "", 'stop').then(function () {
            o.metadata.annotations['openshift.io/deployment.cancelled'] = 'true';
            ReplicationController.put({namespace: $rootScope.namespace, name: o.metadata.name}, o, function (res) {
              // $log.info("stop rc success", res);

              Toast.open('本部署已经终止');

            }, function (res) {
              //todo 错误处理
              // $log.info("stop rc err", res);
            });
          });
        };

        var deleService = function(){
          Service.delete({namespace: $rootScope.namespace,name:$scope.dc.metadata.name}, function (res) {
            // console.log("deleService-yes",res);
          },function(res){
            // console.log("deleService-no",res);
          })
        }
        
        var deleRoute = function(){
          Route.delete({namespace: $rootScope.namespace,name:$scope.dc.metadata.name}, function (res) {
            // console.log("deleRoute-yes",res);
          },function(res){
            // console.log("deleRoute-no",res);
          })
        }
        
        var rmRcs = function (dc) {
          if (!dc) {
            return;
          }
          var labelSelector = 'openshift.io/deployment-config.name=' + dc;
          ReplicationController.remove({namespace: $rootScope.namespace, labelSelector: labelSelector}, function (res) {
            // $log.info("remove rcs success", res);
            rmDc(dc)
          }, function (res) {
            // $log.info("remove rcs err", res);
          });
        };

        var rmDc = function (dc) {
          if (!dc) {
            return;
          }
          DeploymentConfig.remove({
            namespace: $rootScope.namespace,
            name: dc
          }, function () {
            $http.delete('/api/v1/namespaces/'+$rootScope.namespace+'/pods?' + 'labelSelector=deploymentconfig%3D'+$scope.dc.metadata.name).
            success(function(data) {
              // console.log(data);
            }).
            error(function(err) {});
            // $log.info("remove deploymentConfig success");

            $state.go("console.service");

          }, function (res) {
            // $log.info("remove deploymentConfig fail", res);
            //todo 错误处理
          });
        };

        var delBing = function(bindings){
          angular.forEach(bindings, function (binding) {
            var bindObj = {
              metadata: {
                name: binding.metadata.name,
                annotations : {
                  "dadafoundry.io/create-by" : $rootScope.user.metadata.name
                }
              },
              resourceName: $scope.dc.metadata.name,
              bindResourceVersion: '',
              bindKind: 'DeploymentConfig'
            };
            // console.log(bindObj)
            BackingServiceInstanceBd.put({namespace: $rootScope.namespace, name: binding.metadata.name},
                bindObj, function (res) {
                   //console.log('解绑定', res);
                   Toast.open('解除绑定');
                }, function (res) {

                });
          });

        }
        $scope.delete = function () {
          //console.log('---------------',$scope.bsi.items);
          var bindings = [];
          for(var i = 0 ; i < $scope.bsi.items.length;i++){
            if($scope.bsi.items[i].bind){
              bindings.push($scope.bsi.items[i]);
            }
          }
          //console.log('---------------++++++',bindings);
          Confirm.open("删除服务", "您确定要删除服务吗?", "删除服务将解绑持久化卷和外部服务,此操作不能被撤销", 'recycle').then(function () {
            if ($scope.rcs.items.length > 0) {
              rmRcs($scope.dc.metadata.name);

            } else {
              rmDc($scope.dc.metadata.name);
            }
            if(bindings.length>0){
              delBing(bindings);
            }
            // var labelSelector = 'deployment config='+$scope.dc.metadata.name;
            // deletepod.delete({namespace: $rootScope.namespace,labelSelector: labelSelector},function (data) {
            //   console.log(data)
            // })
            deleService();
            deleRoute();
          });
        };

        $scope.getLog = function (idx) {

          var o = $scope.rcs.items[idx];
          o.showLog = !o.showLog;
          //console.log(o.showLog);
          if (!o.showLog) {
            $scope.baocuname=null;
            o.log=null;
          }else {
            $scope.baocuname=o.metadata.name;
          }

          o.showConfig = false;
          //if ($scope.test) {
          //  o.log=$scope.test
          //}
          //存储已经调取过的log
          // console.log(o.log);

          if (o.log) {

            //o.log = $sce.trustAsHtml(o.log);
            loglast()
            return;
          }else {
            DeploymentConfig.log.get({namespace: $rootScope.namespace, name: $scope.dc.metadata.name}, function (res) {

              var result = "";
              for (var k in res) {
                if (/^\d+$/.test(k)) {
                  result += res[k];
                }
              }
              if (result == '') {
                result=$scope.test
              }else {
                $scope.test =result
              }
              var html = ansi_ups.ansi_to_html(result);
              //var result = ansi_ups.open().ansi_to_html(result);
              //alert(11111)
              //console.log(html);
              o.log = $sce.trustAsHtml(html);
              loglast()
              //if (result == '') {
              //  result=$scope.test
              //}else {
              //  $scope.test =result
              //}
              //o.log = result;
            }, function (res) {
              //todo 错误处理
              o.log = res.data.message;
            });
          }

          //DeploymentConfig.log.get({namespace: $rootScope.namespace, name: $scope.dc.metadata.name}, function (res) {
          //  var result = "";
          //  for (var k in res) {
          //    if (/^\d+$/.test(k)) {
          //      result += res[k];
          //    }
          //  }
          //  o.log = result;
          //  loglast()
          //
          //}, function (res) {
          //  //todo 错误处理
          //  o.log = res.data.message;
          //});
        };

        $scope.getConfig = function (idx) {
          var o = $scope.rcs.items[idx];
          o.showConfig = !o.showConfig;

          if (o.dc) {
            updatePorts(o.dc.spec.template.spec.containers);
          }

          $scope.bindingBsi = [];
          angular.forEach($scope.bsi.items, function (item) {
            angular.forEach(item.spec.binding, function (bind) {
              // console.log("============", bind.bind_deploymentconfig, o.dc.metadata.name);
              if (bind.bind_deploymentconfig == o.dc.metadata.name) {
                $scope.bindingBsi.push(o.dc.metadata.name);
              }
            })
          });

          o.showLog = false;

          //todo 获取更多的配置
        };

        var loadPods = function (dc) {
          var labelSelector = 'deploymentconfig=' + dc;
          $scope.dc.status.replicas = 0;
          Pod.get({namespace: $scope.namespace, labelSelector: labelSelector}, function (res) {
            $scope.pods = res;
            $scope.pods.items = res.items;
            $scope.dc.status.replicas = 0;
            for(var i = 0;i < res.items.length; i++){
              $scope.pods.items[i].reason = res.items[i].status.phase;
               if(res.items[i].status.reason != null && res.items[i].status.reason != ""){
                 $scope.pods.items[i].reason = res.items[i].status.reason;
               }
              if(res.items[i].status.containerStatuses){
                for(var j = 0 ;j < res.items[i].status.containerStatuses.length;j++){
                  var container =  res.items[i].status.containerStatuses[j];
                  if (container.state.waiting != null && container.state.waiting.reason != "" ){
                    $scope.pods.items[i].reason = container.state.waiting.reason
                  } else if (container.state.terminated != null && container.state.terminated.reason != "") {
                    $scope.pods.items[i].reason = container.state.terminated.reason
                  }else if (container.state.terminated != null && container.state.terminated.reason == "") {
                    if (container.state.terminated.signal != 0) {
                      $scope.pods.items[i].reason = "Signal:%d"+container.state.terminated.signal;
                    } else {
                      $scope.pods.items[i].reason = "ExitCode:"+container.state.terminated.exitCode;
                    }
                  }
                }
              }
              if (res.items[i].metadata.deletionTimestamp != null ){
                $scope.pods.items[i].reason = "Terminating"
              }
              if($scope.pods.items[i].reason == 'Running'){
                $scope.dc.status.replicas++;
              }
            }

            // $log.info("pods", $scope.pods.items);
            loadEvents(res.items);

          }, function (res) {
            //todo 错误处理
            // $log.info("loadPods err", res);
          });
        };

        var loadEvents = function (pods) {
          var podNames = [];
          for (var i = 0; i < pods.length; i++) {
            podNames.push(pods[i].metadata.name);
          }
          Event.get({namespace: $rootScope.namespace}, function (res) {
            // $log.info("events", res);

            var events = [];
            for (var i = 0; i < res.items.length; i++) {
              if (podNames.indexOf(res.items[i].involvedObject.name) != -1) {
                events.push(res.items[i]);
              }
            }
            res.items = Sort.sort(events, -1);
            $scope.events = res;
          }, function (res) {
            //todo 错误处理
            // $log.info("loadEvents err", res)
          });
        };

        $scope.logModal = function (idx) {
          var o = $scope.pods.items[idx];
          LogModal.open(o.metadata.name);
        };

        $scope.containerModal = function (idx) {
          var o = $scope.pods.items[idx];
          ContainerModal.open(o);
        };

        $scope.addContainer = function () {
          var container = $scope.dc.spec.template.spec.containers;
          // $log.info("addContainer", container);
          //var portsobj = {
          //  containerPort : "",
          //  hostPort : "",
          //  protocol : ""
          //}
          $scope.dc.spec.template.spec.containers.push({
            //ports: [{
            //  containerPort: "",
            //  protocol: "TCP",
            //  hostPort: "",
            //  //open: ""
            //}],
            volumeMounts: [{}],
            show: true,
            new: true
          });
          //$scope.dc.spec.template.spec.containers.push({ports: [portsobj]});
          // $log.info('dccdcdcdcdcdcdcdcdcd-0-0', $scope.dc.spec.template.spec)
        };

        $scope.rmContainer = function (idx) {
          // console.log("rmContainer");
          $scope.dc.spec.template.spec.containers.splice(idx, 1);
        };
/////////////挂载卷
        var cintainersidx;
        $scope.addVolume = function(idx){
          var olength = 0;
          if($scope.dc.spec.template.spec.volumes){
            olength = $scope.dc.spec.template.spec.volumes.length;
          }

          cintainersidx = idx;
          ChooseSecret.open(olength,$scope.secretsobj).then(function (volumesobj) {
            //console.log('------------------------',volumesobj);
            $scope.dc.spec.template.spec.containers[idx].volumeMounts = volumesobj.arr2;
            $scope.dc.spec.template.spec.volumes = volumesobj.arr1;
            $scope.secretsobj = volumesobj.arr3
            //console.log('-=-=-=-=-=-=-=-=-',$scope.onlyDC);
          });
        }






        $scope.delEnv = function (idx) {
                $scope.envs.splice(idx, 1);
        };
        $scope.addEnv = function(){
          $scope.envs.push({name: '', value: ''});
        }
        $scope.addprot = function (ind, last) {
          if (last) {     //添加
            $scope.portsArr.unshift({
              containerPort: "",
              protocol: "",
              hostPort: "",
            })
          } else {
            $scope.portsArr.splice(ind, 1);
          }
        };

        $scope.selectImage = function (idx) {
          var arrimgstr = [];
          if($scope.dc.metadata.annotations.imageorpublic){
            arrimgstr = $scope.dc.metadata.annotations.imageorpublic.split(",");
          }
          var container = $scope.dc.spec.template.spec.containers[idx];
          var cons = $scope.dc.spec.template.spec.containers;
          ImageSelect.open().then(function (res) {
            //console.log("imageStreamTag", res);
            var imagetag = '';
            if(res.ispublicimage){
              var str1 =  res.imagesname.split("/");
              var strname1 = str1[0]+'/'+str1[1];
              var olsname = strname1.replace('/', "-");
              container.truename = strname1.replace('/', "-");
              container.image = 'registry.dataos.io/'+str1[0]+'/'+str1[1]+':'+str1[2];
              container.isimageChange = false;
              if (idx > 0) {
                for(var i = 0 ; i < cons.length;i++){
                  if(cons[i].name == olsname){
                    strname1 = str1[0]+'/'+str1[1] + idx;
                  }
                }
              }
              container.strname = strname1.replace('/', "-");
              container.name = strname1.replace('/', "-");
              container.tag = str1[2];
              imagetag = 'image-'+container.name;
              $scope.dc.metadata.annotations[imagetag] = str1[2];
              ////仓库镜像
              if(res.imagePullSecrets){
                container.imagePullSecrets = true;
              }else{
                delete container["imagePullSecrets"];
              }

            }else{
              container.image = res.image.dockerImageReference
              container.isimageChange = true;
              delete container["imagePullSecrets"] ;
              var arr = res.metadata.name.split(':');
              container.tag = arr[1];
              if (arr.length > 1) {
                container.name = arr[0];
              }
              container.truename = arr[0];
              if (idx > 0) {
                for(var i = 0 ; i < cons.length;i++){
                  if(cons[i].name == arr[0]){
                    container.name = arr[0] + idx
                  }
                }
              }
              imagetag = 'image-'+container.name;
              $scope.dc.metadata.annotations[imagetag] = arr[1];
            }
            for(var i = 0 ;i < $scope.dc.spec.template.spec.containers.length;i++ ){
              if($scope.dc.spec.template.spec.containers[i].isimageChange != false && $scope.dc.spec.template.spec.containers[i].isimageChange != true){
                $scope.dc.spec.template.spec.containers[i].isimageChange = arrimgstr[i];
              }
              if($scope.dc.spec.template.spec.containers[i].isimageChange == false){
                //公共镜像
                $scope.grid.isimageChange = false;
                $scope.grid.imageChange = false;
                break;
              }else{
                $scope.grid.isimageChange = true;
                $scope.grid.imageChange = true;

              }
            }
            //var arr = res.metadata.name.split(':');
            //if (arr.length > 1) {
            //  container.name = arr[0];
            //}

            // container.ports = [];
            //var exposedPorts = res.image.dockerImageMetadata.Config.ExposedPorts;
            //for (var k in exposedPorts) {
            //  arr = k.split('/');
            //  if (arr.length == 2) {
            //    container.ports.push({
            //      containerPort: "",
            //      protocol: "TCP",
            //      hostPort: "",
            //      open: ""
            //    })
            //  }
            //}
            isConflict();
          });
        };


        var prepareVolume = function (dc) {
          var containers = dc.spec.template.spec.containers;
          for (var i = 0; i < containers.length; i++) {
            var container = containers[i];
            if(!container.volumeMounts){
              return;
            }
            if(container.volumeMounts && container.volumeMounts.length == 0 ){
              delete container["volumeMounts"];
            }

          }
          if(dc.spec.template.spec.volumes.length == 0){
            delete dc.spec.template.spec["volumes"];
          }
        };

        var prepareTrigger = function (dc) {
          var triggers = [];
          if ($scope.grid.configChange) {
            triggers.push({type: 'ConfigChange'});
          }

          if ($scope.grid.imageChange) {
            var containers = dc.spec.template.spec.containers;
            for (var i = 0; i < containers.length; i++) {
              // $log.info('containers=====', containers[i]);
              triggers.push({
                type: 'ImageChange',
                imageChangeParams: {
                  "automatic": true,
                  "containerNames": [containers[i].name],
                  "from": {
                    "kind": "ImageStreamTag",
                    "name": containers[i].name + ':' + containers[i].tag
                  }
                }
              });
            }
          }
          dc.spec.triggers = triggers;
        };

        var isBind = function (bsi, dc) {
          var bindings = bsi.spec.binding;
          if (!bindings) {
            return false;
          }
          for (var j = 0; j < bindings.length; j++) {
            if (bindings[j].bind_deploymentconfig == dc.metadata.name) {
              return true;
            }
          }
          return false;
        };

        var bindService = function (dc) {
          angular.forEach($scope.bsi.items, function (bsi) {
            var bindObj = {
              metadata: {
                name: bsi.metadata.name,
                annotations : {
                  "dadafoundry.io/create-by" : $rootScope.user.metadata.name
                }
              },
              resourceName: dc.metadata.name,
              bindResourceVersion: '',
              bindKind: 'DeploymentConfig'
            };

            if (isBind(bsi, dc) && !bsi.bind) {  //绑定设置为不绑定
              BackingServiceInstance.bind.put({
                namespace: $rootScope.namespace,
                name: bsi.metadata.name
              }, bindObj, function (res) {
                // $log.info("unbind service success", res);
              }, function (res) {
                // $log.info("unbind service fail", res);
              });
            }

            if (!isBind(bsi, dc) && bsi.bind) {  //未绑定设置为绑定
              BackingServiceInstance.bind.create({
                namespace: $rootScope.namespace,
                name: bsi.metadata.name
              }, bindObj, function (res) {
                // $log.info("bind service success", res);
              }, function (res) {
                // $log.info("bind service fail", res);
              });
            }
          });
        };

        var updateService = function (dc) {
          var ps = [];
          var containers = dc.spec.template.spec.containers;
            var ports = $scope.portsArr || [];
            for (var j = 0; j < $scope.portsArr.length; j++) {
              //if (!ports[j].open) {
              //  continue;
              //}
              if (ports[j].hostPort) {
                ps.push({
                  name: ports[j].hostPort + '-' + ports[j].protocol.toLowerCase(),
                  port: parseInt(ports[j].hostPort),
                  protocol: ports[j].protocol,
                  targetPort: parseInt(ports[j].containerPort)
                });
              }
            }
          $scope.service.spec.ports = ps;
          $scope.service.metadata.name = $scope.dc.metadata.name;
          Service.put({
            namespace: $rootScope.namespace,
            name: $scope.service.metadata.name
          }, $scope.service, function (res) {
            // $log.info("update service success", res);
            $scope.service = res;
          }, function (res) {
            // $log.info("update service fail", res);
          });
        };

        var prepareRoute = function (route, dc) {
          route.metadata.name = dc.metadata.name;
          route.metadata.labels.app = dc.metadata.name;
          route.spec.host = $scope.grid.host + $scope.grid.suffix;
          route.spec.to.name = dc.metadata.name;
          route.spec.port.targetPort = $scope.grid.port + '-tcp';
        };

        var prepareEnv = function (dc) {
          var containers = dc.spec.template.spec.containers;
          for (var i = 0; i < containers.length; i++) {
            containers[i].env = $scope.envs;
          }
        };

        $scope.route = {
          "kind": "Route",
          "apiVersion": "v1",
          "metadata": {
            "name": "",
            "labels": {
              "app": ""
            }
          },
          "spec": {
            "host": "",
            "to": {
              "kind": "Service",
              "name": ""
            },
            "port": {
              "targetPort": ""
            }
          }
        };
        
        var createService = function (dc) {
          prepareService($scope.service, dc);
          var ps = [];
            if ($scope.portsArr) {
              var ports =$scope.portsArr;
              for (var j = 0; j < ports.length; j++) {
                //if (!ports[j].open) {
                //  continue;
                //}
                if (ports[j].hostPort) {
                  var val = ports[j].protocol.toUpperCase()
                  ps.push({
                    name: ports[j].hostPort + '-' + ports[j].protocol.toLowerCase(),
                    port: parseInt(ports[j].hostPort),
                    protocol: val,
                    targetPort: parseInt(ports[j].containerPort)
                  });
                }
              }
            }
          if (ps.length > 0) {
            $scope.service.spec.ports = ps;
          } else {
            $scope.service.spec.ports = null;
          }
          Service.create({namespace: $rootScope.namespace}, $scope.service, function (res) {
            // $log.info("create service success", res);
            $scope.service = res;

            if ($scope.grid.route) {
              createRoute(res);
            }
            //$state.go('console.service_detail', {name: dc.metadata.name});
          }, function (res) {
            // $log.info("create service fail", res);
            //$state.go('console.service_detail', {name: dc.metadata.name});
          });
        };
        
        var prepareService = function (service, dc) {
          service.metadata.name = dc.metadata.name;
          service.metadata.labels.app = dc.metadata.name;
          service.spec.selector.app = dc.metadata.name;
          service.spec.selector.deploymentconfig = dc.metadata.name;
        };
        
        var createRoute = function (service) {
          prepareRoute($scope.route, service);

          Route.create({namespace: $rootScope.namespace}, $scope.route, function (res) {
            // $log.info("create route success", res);
            $scope.route = res;
          }, function (res) {
            // $log.info("create route fail", res);
          });
        };
        
        var updateRoute = function (dc) {
          if (dc.route) {     //route存在,更新route
            dc.route.spec.host = $scope.grid.host + $scope.grid.suffix;
            dc.route.spec.port.targetPort = $scope.grid.port + '-tcp';
            Route.put({namespace: $rootScope.namespace, name: dc.route.metadata.name}, dc.route, function (res) {
              // $log.info("create route success", res);
              $scope.route = res;
            }, function (res) {
              // $log.info("create route fail", res);
            });
          } else {            //route不存在,创建route
            prepareRoute($scope.route, dc);
            Route.create({namespace: $rootScope.namespace}, $scope.route, function (res) {
              // $log.info("create route success", res);
              $scope.route = res;
            }, function (res) {
              // $log.info("create route fail", res);
            });
          }
        };
        
//点击更新
        $scope.updateDc = function () {
          // console.log('点击更新');
          if(isConflict()){
                return
          }
          for (var q = 0; q < $scope.portsArr.length; q++) {
            $scope.portsArr[q].conflict=false;
            $scope.portsArr[q].serviceConflict=false;
          }
          $rootScope.lding = true;
          // $scope.dc.spec.template.spec.containers[0].volumeMounts=[];
          // $scope.dc.spec.template.spec.containers[0].volumeMounts.push({mountPath:'/app/pic'})
          var dc = angular.copy($scope.dc);
          var cons = angular.copy($scope.dc.spec.template.spec.containers);
          DeploymentConfig.get({namespace: $rootScope.namespace, name: $stateParams.name}, function (datadc) {
            //dc.spec.template.spec.volumes = [];
            dc.metadata.resourceVersion = datadc.metadata.resourceVersion;
            dc.status.latestVersion = datadc.status.latestVersion+1;
            var flog = 0;
            for (var i = 0; i < dc.spec.template.spec.containers.length; i++) {
              if (cons[i].ports) {
                var testlength = cons[i].ports.length;
                for (var k = 0; k < testlength; k++) {
                  if (!cons[i].ports[k].containerPort) {
                    cons[i].ports.splice(k, 1);
                    k--;
                    testlength--;
                  } else {
                    cons[i].ports[k].name = cons[i].ports[k].protocol + "-" + cons[i].ports[k].containerPort;
                    cons[i].ports[k].protocol = cons[i].ports[k].protocol.toUpperCase()
                  }
                }
                dc.spec.template.spec.containers[i].ports = cons[i].ports;
              }

            }
          // console.log('$scope.savend',$scope.savend)
          //if ($scope.savend) {
          //  dc.spec.template.spec.containers[0].volumeMounts=$scope.savend;
          //}

            prepareVolume($scope.dc);
            prepareTrigger($scope.dc);
            prepareEnv($scope.dc);
            for (var i = 0; i < dc.spec.template.spec.containers.length; i++) {
              if(dc.spec.template.spec.containers[i].truename){
                delete dc.spec.template.spec.containers[i]["truename"];
              }
              if (dc.spec.template.spec.containers[i].ports) {
                for (var j = 0; j < dc.spec.template.spec.containers[i].ports.length; j++) {
                  delete dc.spec.template.spec.containers[i].ports[j]["conflict"];
                  delete dc.spec.template.spec.containers[i].ports[j]["name"];
                  delete dc.spec.template.spec.containers[i].ports[j]["open"];
                  delete dc.spec.template.spec.containers[i].ports[j]["hostPort"];
                }
              }
            }
            var createports = true;
              if ($scope.portsArr) {
                for (var j = 0; j < $scope.portsArr.length; j++) {
                  if ($scope.portsArr[j].hostPort && $scope.portsArr[j].protocol && $scope.portsArr[j].containerPort) {
                    if ($scope.portsArr[j].containerPort || $scope.portsArr[j].hostPort) {
                      if ($scope.portsArr[j].containerPort < 1 || $scope.portsArr[j].containerPort > 65535 || $scope.portsArr[j].hostPort < 1 || $scope.portsArr[j].hostPort > 64435) {
                        createports = false;
                        $scope.servicepoterr = true;
                      }
                    }
                  } else if (!$scope.portsArr[j].hostPort && !$scope.portsArr[j].containerPort && !$scope.portsArr[j].protocol) {
                    createports = true;
                  } else {
                    createports = false;
                    $scope.servicepoterr = true;
                  }
                }
              }

            if(createports == false){
              return;
            }
            if ($scope.grid.route) {
              updateRoute(dc);
            }
          for(var i = 0 ;i < dc.spec.template.spec.containers.length;i++ ){
            if(dc.spec.template.spec.containers[i].isimageChange == false){
              $scope.grid.isimageChange = false;
              break;
            }else{
              $scope.grid.isimageChange = true;
            }
          }
          if($scope.grid.isimageChange == false){
            if( dc.metadata.annotations){
              dc.metadata.annotations["dadafoundry.io/images-from"] = 'public';
            }

            dc.spec.triggers=[{type: 'ConfigChange'}];
          }else{
            if(dc.metadata.annotations){
              dc.metadata.annotations["dadafoundry.io/images-from"] = 'private';
            }
            dc.spec.triggers = $scope.dc.spec.triggers;
          }
          var isport = false;
          for (var i = 0; i < $scope.portsArr.length; i++) {
            if ($scope.portsArr[i].hostPort) {
              isport = true;
              break;
            }
          }
          if (isport == true && iscreatesv == false && createports == true) {
            createService($scope.dc);
          }else if(isport == true && iscreatesv == true && createports == true){
            updateService($scope.dc);
          }
          var isimgsecret = false;
          for(var i = 0 ; i < dc.spec.template.spec.containers.length ; i++ ){
            delete dc.spec.template.spec.containers[i]["tag"];
            delete dc.spec.template.spec.containers[i]["isimageChange"];
            if (dc.spec.template.spec.containers[i].ports) {
              delete dc.spec.template.spec.containers[i]["ports"];
            }
            if(dc.spec.template.spec.containers[i].imagePullSecrets){
              isimgsecret = true;
              var flog = true;
              var imgps = [
                {
                  "name": "registry-dockercfg-"+$rootScope.user.metadata.name
                }
              ]
              angular.forEach($scope.serviceas.imagePullSecrets,function(v,k){
                if(v.name == imgps[0].name){
                     flog = false;
                  }
              })
              if(flog){
                dc.spec.template.spec.imagePullSecrets = imgps.concat($scope.serviceas.imagePullSecrets);
              }else{
                dc.spec.template.spec.imagePullSecrets = $scope.serviceas.imagePullSecrets;
              }

              delete dc.spec.template.spec.containers[i]["imagePullSecrets"];
            }
          }
          if($scope.dc.spec.template.spec.imagePullSecrets && !isimgsecret){
            delete dc.spec.template.spec["imagePullSecrets"];
          }
          if(isimgsecret){
            var nameandps = localStorage.getItem("Auth");
            var newnameandps = $base64.decode(nameandps);
            var registryobjs = {
              "registry.dataos.io": {
                "auth": nameandps,
                "email": "builder@registry.dataos.io",
                "password": newnameandps.split(':')[1],
                "username": newnameandps.split(':')[0]
              }
            }
            registryobjs = JSON.stringify(registryobjs)
            var isdockercfg = $base64.encode(registryobjs);
          }
          var updatedcput = function(dc){
            DeploymentConfig.put({namespace: $rootScope.namespace, name: dc.metadata.name}, dc, function (res) {
              // $log.info("update dc success", res);
              $scope.getdc.spec.replicas = $scope.dc.spec.replicas;
              bindService(dc);
              $scope.active = 1;
            }, function (res) {
              //todo 错误处理
              // $log.info("update dc fail", res);
            });
          }
            //console.log('isimgsecretisimgsecretisimgsecretisimgsecret',isimgsecret);
          if(isimgsecret){
              var secretsobj = {
                "kind": "Secret",
                "apiVersion": "v1",
                "metadata": {
                  "name": "registry-dockercfg-"+$rootScope.user.metadata.name
                },
                "data": {
                  ".dockercfg": isdockercfg

                },
                "type": "kubernetes.io/dockercfg"

              }

              secretskey.create({namespace: $rootScope.namespace},secretsobj, function (res) {
                updatedcput(dc);
              },function(res){
                if(res.status == 409){
                  updatedcput(dc);
                }
              })
          }else{
             updatedcput(dc);
          }

          })

        };
        
      }])
    .service('LogModal', ['$uibModal', function ($uibModal) {
      this.open = function (pod) {
        return $uibModal.open({
          templateUrl: 'views/service_detail/logModal.html',
          size: 'default modal-lg',
          controller: ['$sce','ansi_ups','$rootScope', '$scope', '$uibModalInstance', 'Pod',
            function ($sce,ansi_ups,$rootScope, $scope, $uibModalInstance, Pod) {
            $scope.grid = {};
            $scope.pod = pod;
            // console.log("pod-=-=-=-=-++++",pod);
            $scope.ok = function () {
              $uibModalInstance.close(true);
            };
            $scope.cancel = function () {
              $uibModalInstance.dismiss();
            };
            var loglast= function () {
              setTimeout(function () {
                $('#sc').scrollTop(1000000)
              },200)
            }
            $scope.getLog = function (pod) {
              var params = {
                namespace: $rootScope.namespace,
                name: pod,
                sinceTime: $scope.grid.st ? $scope.grid.st.toISOString() : (new Date(0)).toISOString()
              };
              Pod.log.get(params, function (res) {
                var result = "";
                for (var k in res) {

                  if (/^\d+$/.test(k)) {
                    result += res[k];
                  }
                }
                var html = ansi_ups.ansi_to_html(result);
                //var result = ansi_ups.open().ansi_to_html(result);
                //alert(11111)
                //console.log(html);
                $scope.log = $sce.trustAsHtml(html);
                loglast()

              }, function (res) {
                $scope.log = res.data.message;
              });
            };
            $scope.getLog(pod);
            $scope.search = function () {
              $scope.getLog($scope.pod);
            };
          }]
        }).result;
      };
    }])
    .service('ContainerModal', ['$uibModal', function ($uibModal) {
      this.open = function (pod) {
        return $uibModal.open({
          templateUrl: 'views/service_detail/containerModal.html',
          size: 'default modal-lg',
          controller: ['$sce','ansi_ups','$rootScope', '$scope', '$log', '$uibModalInstance', 'ImageStream', 'Pod', 'Ws', 'Metrics', 'MetricsService',
            function ($sce,ansi_ups,$rootScope, $scope, $log, $uibModalInstance, ImageStream, Pod, Ws, Metrics, MetricsService) {
            $scope.pod = pod;
            // console.log("pod-=-=-=-=-!!!!",pod);
            $scope.grid = {
              show: false,
              mem: false,
              cpu: false
            };
            $scope.ok = function () {
              $uibModalInstance.close(true);
            };
            $scope.cancel = function () {
              $uibModalInstance.dismiss();
            };

            var imageStreamName = function (image) {
              if (!image) {
                return "";
              }
              var match = image.match(/\/([^/]*)@sha256/);
              if (!match) {
                return image.split(":");
              }
              return match[1];
            };

            var preparePod = function (pod) {
              var status = pod.status.containerStatuses;
              var statusMap = {};
              for (var i = 0; i < status.length; i++) {
                statusMap[status[i].name] = status[i];
              }
              var containers = pod.spec.containers;
              angular.forEach(pod.spec.containers, function (container) {
                if (statusMap[container.name]) {
                  container.status = statusMap[container.name];
                }
                if(container.image.indexOf('@') != -1){
                  ImageStream.get({
                    namespace: $rootScope.namespace,
                    name: imageStreamName(container.image)
                  }, function (res) {
                    if (res.kind == 'ImageStream') {
                      angular.forEach(res.status.tags, function (tag) {
                        angular.forEach(tag.items, function (item) {
                          if (container.image.indexOf(item.image)) {
                            container.tag = tag.tag;
                          }
                        });
                      });
                    }
                  });
                }else{
                  container.tag = imageStreamName(container.image)[1];
                }
              });
              // console.log('====', $scope.pod)
            };
            preparePod($scope.pod);

            $scope.containerDetail = function (idx) {
              var o = pod.spec.containers[idx];
              $scope.grid.show = true;
              $scope.container = o;
              $scope.getLog(o.name);
              //terminal(o.name);
              getMetrics(pod, o);
            };

            $scope.back = function () {
              $scope.grid.show = false;
            };

            $scope.search = function () {
              // console.log("sinceTime", $scope.grid.st);
              $scope.getLog($scope.container.name);
            };

            $scope.getLog = function (container) {
              var params = {
                namespace: $rootScope.namespace,
                name: pod.metadata.name,
                container: container,
                sinceTime: $scope.grid.st ? $scope.grid.st.toISOString() : (new Date(0)).toISOString()
              };
              Pod.log.get(params, function (res) {
                var result = "";
                for (var k in res) {
                  if (/^\d+$/.test(k)) {
                    result += res[k];
                  }
                }

                var html = ansi_ups.ansi_to_html(result);
                //var result = ansi_ups.open().ansi_to_html(result);
                //alert(11111)
                //console.log(html);
                $scope.log = $sce.trustAsHtml(html);
                //$scope.log = result;
                loglast()
                
                // console.log(result);
              }, function (res) {
                $scope.log = res.data.message;
              });
            };

            $scope.terminalSelect = function () {
              $scope.terminalTabWasSelected = true;
            };

            $scope.terminalTabWasSelected = false;

            var setChart = function (name, data) {
              data = prepareData(name, data);
              return {
                options: {
                  chart: {
                    type: 'areaspline'
                  },
                  title: {
                    text: name,
                    align: 'left',
                    x: 0,
                    style: {
                      fontSize: '12px'
                    }
                  },
                  tooltip: {
                    backgroundColor: '#666',
                    borderWidth: 0,
                    shadow: false,
                    style: {
                      color: '#fff'
                    },
                    formatter: function () {
                      if (name == 'CPU') {
                        return this.y.toFixed(2);
                      }
                      return (this.y / 1000000).toFixed(2) + 'M';
                    }
                  },
                  legend: {
                    enabled: false
                  }
                },
                series: [{
                  color: '#f6a540',
                  fillOpacity: 0.3,
                  marker: {
                    enabled: false
                  },
                  data: data,
                  pointStart: (new Date()).getTime() - 30 * 60 * 1000 + 8 * 3600 * 1000,
                  pointInterval: 30000 //时间间隔
                }],
                xAxis: {
                  type: 'datetime',
                  gridLineWidth: 1
                },
                yAxis: {
                  gridLineDashStyle: 'ShortDash',
                  title: {
                    text: ''
                  }
                },
                size: {
                  width: 798,
                  height: 130
                },
                func: function (chart) {
                  //setup some logic for the chart
                }
              };
            };

            var prepareData = function (tp, data) {
              var res = [];
              MetricsService.normalize(data, tp);
              for (var i = 0; i < data.length - 1; i++) {
                res.push(data[i].value);
              }
              return res;
            };

            var getMetrics = function (pod, container) {
              var st = (new Date()).getTime() - 30 * 60 * 1000;
              var gauges = container.name + '/' + pod.metadata.uid + '/memory/usage';
              var counters = container.name + '/' + pod.metadata.uid + '/cpu/usage';
              Metrics.mem.query({gauges: gauges, buckets: 61, start: st}, function (res) {
                // $log.info("metrics mem", res);
                $scope.chartConfigMem = setChart('内存', res);
                $scope.grid.mem = true;
              }, function (res) {
                // $log.info("metrics mem err", res);
                $scope.chartConfigMem = setChart('内存', []);
                $scope.grid.mem = false;
              });
              Metrics.cpu.query({counters: counters, buckets: 61, start: st}, function (res) {
                // $log.info("metrics cpu", res);
                $scope.chartConfigCpu = setChart('CPU', res);
                $scope.grid.cpu = true;
              }, function (res) {
                // $log.info("metrics cpu err", res);
                $scope.chartConfigCpu = setChart('CPU', []);
                $scope.grid.cpu = false;
              });
            };

            $scope.chartConfigIo = setChart('网络IO', []);
          }]
        }).result;
      };
    }])
    .filter('rcStatusFilter', [function () {
      return function (phase) {
        if (phase == "New" || phase == "Pending" || phase == "Running") {
          return "正在部署"
        } else if (phase == "Complete") {
          return "部署成功"
        } else if (phase == "Failed") {
          return "部署失败"
        } else if (phase == "Error") {
          return "部署错误"
        } else if (phase == "Cancelled") {
          return "终止"
        } else {
          return phase || "-"
        }
      };
    }]);
