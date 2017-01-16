'use strict';

angular.module('console.user', [
    'kubernetesUI',
    {
        files: [
            'views/org/org.css',
            'components/datepick/datepick.js',
            'components/timeline/timeline.js',
            'components/checkbox/checkbox.js'

        ]
    }
]).controller('orgCtrl', ['delTip','amounts','delperpleOrg', 'orgList', '$log', 'Project', '$http', '$rootScope', '$state', '$cacheFactory', 'loadOrg', 'Addmodal', 'Confirm', '$scope', '$stateParams', 'invitation', 'leave', 'Toast',
    function (delTip,amounts,delperpleOrg, orgList, $log, Project, $http, $rootScope, $state, $cacheFactory, loadOrg, Addmodal, Confirm, $scope, $stateParams, invitation, leave, Toast) {
        $scope.grid = {
            st: null,
            et: null,
            page:1,
            size:10
        }
        $scope.isadmin=false;
        var refresh = function(page) {
            var skip = (page - 1) * $scope.grid.size;
            $scope.myamounts = $scope.amountdata.slice(skip, skip + $scope.grid.size);
            $(document.body).animate({
                scrollTop:0
            },200);

        };
        $scope.$watch('grid.page', function(newVal, oldVal){
            if (newVal != oldVal) {
                refresh(newVal);
            }
        });
        //$rootScope.delOrgs = false;

        var loadOrg = function () {
            //console.log('test org name',$stateParams.useorg,$rootScope.namespace)
            orgList.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
                //console.log(data);
                //$scope.rootmembers = [];
                //$scope.norootmembers = [];
                $scope.orgcan=data
                angular.forEach(data.items, function (item, i) {

                    if (item.roleRef.name === 'admin') {
                        $scope.roottime =item.metadata;
                        $scope.rootmembers=item.subjects
                    }else if(item.roleRef.name === "edit"){
                        $scope.noroottime =item.metadata;
                        $scope.norootmembers=item.subjects
                    }
                })
                angular.forEach($scope.rootmembers, function (item,i) {
                    console.log($rootScope.user.metadata.name, item);
                    if (item.name === $rootScope.user.metadata.name) {
                        $scope.isadmin=true;
                    }
                    angular.forEach($scope.roottime.annotations, function (root,k) {
                        if (item.name === k.split('/')[1]) {
                            $scope.rootmembers[i].jointime=root;
                        }
                    })

                })

                angular.forEach($scope.rootmembers, function (item,i) {
                    if (!item.jointime) {
                        $scope.rootmembers[i].jointime=$scope.roottime.creationTimestamp;
                    }

                })
                angular.forEach($scope.norootmembers, function (item, i) {
                    angular.forEach($scope.noroottime.annotations, function (root, k) {
                        if (item.name === k.split('/')[1]) {
                            $scope.norootmembers[i].jointime = root;
                        }
                    })

                })
                angular.forEach($scope.norootmembers, function (item,i) {
                    if (!item.jointime) {
                        $scope.norootmembers[i].jointime=$scope.noroottime.creationTimestamp;
                    }

                })

                console.log($scope.rootmembers, $scope.norootmembers);

            })
            //$http({
            //  url:'/lapi/orgs/'+$stateParams.useorg,
            //  method:'GET'
            //}).success(function(data,header,config,status,orgid){
            //  if (data.id) {
            //    //console.log('load org data',data);
            //    $scope.members=data.members;
            //    $scope.orgcon = data;
            //    $scope.rootmembers=[];
            //    $scope.norootmembers=[];
            //    angular.forEach(data.members,function (item) {
            //      //item.jioned
            //      if (item.status == "joined") {
            //        if (item.privileged) {
            //          $scope.rootmembers.push(item);
            //        }else {
            //          $scope.norootmembers.push(item);
            //        }
            //      }
            //
            //    })
            //  }
            //}).error(function(data,header,config,status){
            //});
        }
        $scope.changename= function (name) {
            $scope.savename = $scope.mydisorgname;
            //$scope.mydisorgname='';
            $scope.settingname=true;
            $scope.mysetname=$scope.mydisorgname
            setTimeout(function () {
                $('#orgdisname').focus()
            },100)
            //var obj= angular.copy($scope.myproject);
            //console.log($scope.mysetname,name);
        }
        $scope.setting= function () {
            $scope.settingname=true;
            setTimeout(function () {
                $('#orgdisname').focus()
            },100)
            //$scope.savename = $scope.mydisorgname;
            // $scope.mydisorgname='';
        }
        $scope.cancel= function () {
            $scope.settingname=false;

            //$scope.savename = $scope.mydisorgname;
            // $scope.mydisorgname='';
        }
        $scope.changenamed= function (name) {
            //console.log('$scope.myproject', $scope.myproject);
            //var obj= angular.copy($scope.myproject);
            //console.log($scope.mysetname,name);
            //obj.metadata.annotations['openshift.io/display-name']=name;
            //console.log(obj);
            $scope.disable=true;
            Project.get({region: $rootScope.region,name:$scope.myorgname}, function (poj) {
                poj.metadata.annotations['openshift.io/display-name']=name;
                Project.put({region: $rootScope.region,name:$scope.myorgname},poj, function (data) {
                    $scope.mydisorgname=data.metadata.annotations['openshift.io/display-name'];
                    $rootScope.changedisplayname=data.metadata.annotations['openshift.io/display-name'];
                    $scope.settingname=false;
                    //console.log('data', data);
                    $scope.disable=false;
                }, function (err) {
                    $scope.disable=false;
                })
            }, function (err) {
                $scope.disable=false;
            })
        }
        //load project
        var loadProject = function () {
            Project.get({region: $rootScope.region}, function (data) {
                //$rootScope.projects = data.items;
                //console.log('Project', Project);
                //var newprojects = [];
                data.items.sort(function (x, y) {
                    return x.sortname > y.sortname ? 1 : -1;
                });
                angular.forEach(data.items, function (project, i) {
                    if (project.metadata.name === $rootScope.namespace) {
                        $scope.myproject=project;
                        $scope.mydisorgname = project.metadata.annotations['openshift.io/display-name'];
                        $scope.myorgname = project.metadata.name;
                    }

                });
                //console.log(data.items);


                //$log.info("load project success", data);
            }, function (res) {
                $log.info("find project err", res);
            });
            //$http.get('/oapi/v1/projects', {
            //}).success(function(data){
            //  console.log('test project', data);
            //})
        }
        loadProject();
        amounts.get({size:500,page:1,namespace:$rootScope.namespace,status:'O',region:$rootScope.region}, function (data) {
            //console.log(data);
            if (data.amounts) {
                data.amounts.reverse()
                angular.forEach(data.amounts, function (amount,i) {
                    data.amounts[i].creation_time = amount.creation_time.replace(/Z/,$scope.clientTimeZone)
                    if (amount.description === "recharge") {
                        data.amounts[i].description='充值'
                    }else {
                        data.amounts[i].description='扣费'
                    }
                })

                $scope.myamounts = data.amounts||[];
                console.log('$scope.myamounts',$scope.myamounts);
                $scope.amountdata =angular.copy(data.amounts)
                $scope.grid.total = data.amounts.length;
                refresh(1);
            }


        })
        //$scope.deletezz = function () {
        //    if ($scope.rootmembers.length == 1 && $scope.norootmembers.length == 0) {
        //        Confirm.open("删除组织", "您确定要删除组织吗？", "此操作不可撤销", "stop").then(function () {
        //            $http.delete('/lapi/orgs/' + $stateParams.useorg, {}).success(function (item) {
        //                //console.log('the org has been deelted', item);
        //                $rootScope.delOrgs = true;
        //                //$rootScope.isorg = false;
        //                loadProject();
        //                $rootScope.namespace = $rootScope.user.metadata.name;
        //                $state.go('console.user', {index: 4});
        //                //console.user()
        //            })
        //        })
        //    } else {
        //        Confirm.open("离开组织", "删除组织失败", "组织内还有其他成员，您需要先移除其他成员", null, true)
        //    }
        //}

        $scope.addpeople = function () {
            Addmodal.open('邀请新成员', '用户名', '', $stateParams.useorg, 'people').then(function (res) {
                Toast.open('邀请消息发送成功!');
                loadOrg();
            })
        }
        $scope.remove = function (idx) {
            delTip.open("移除", $scope.rootmembers[idx].name, null, "").then(function () {
                //console.log('test root members before remove',$scope.rootmembers )
                console.log($scope.rootmembers[idx].member_name);
                delperpleOrg.put({namespace: $rootScope.namespace, region: $rootScope.region}, {
                    member_name: $scope.rootmembers[idx].name
                }, function (data) {
                    Toast.open('删除成功');
                    loadOrg();
                }, function (err) {

                })
                //$http.put('/lapi/orgs/'+$stateParams.useorg+'/remove',{
                //  member_name:$scope.rootmembers[idx].member_name
                //}).success(function(data){
                //  Toast.open('删除成功')
                //  //console.log('test rootmember who has been removed', $scope.rootmembers[idx].member_name);
                //  loadOrg();
                //})
            })
        }

        $scope.removenotroot = function (idx) {
            delTip.open("移除",$scope.norootmembers[idx].name, null, "").then(function () {
                delperpleOrg.put({namespace: $rootScope.namespace, region: $rootScope.region}, {
                    member_name: $scope.norootmembers[idx].name
                }, function (data) {
                    Toast.open('删除成功');
                    loadOrg();
                }, function (err) {

                })
                //console.log('test noroot member before remove', $scope.norootmembers)
                //$http.put('/lapi/orgs/' + $stateParams.useorg + '/remove', {
                //    member_name: $scope.norootmembers[idx].member_name
                //}).success(function () {
                //    Toast.open('删除成功')
                //    //console.log('test noroot who has been removed', $scope.norootmembers[idx].member_name)
                //    loadOrg();
                //})
            })
        }

        $scope.leave = function (res) {
            //for(var i = 0; i < $scope.rootmembers.length; i++){
            //console.log('test how many rootmember',$scope.rootmembers.length )

            if ($scope.rootmembers.length == 1 && $scope.norootmembers == 0) {
                Confirm.open("离开组织", "不能离开！", "您是最后一名管理员请先指定其他管理员，才能离开。", "", true).then(function () {
                    //console.log('the last rootmember', $scope.rootmembers)
                })
            } else {
                //loadOrg(data);
                Confirm.open("离开组织", "您确定要离开 " + $scope.orgcon.name + " 吗？", null, "").then(function () {
                    leave.left({org: $stateParams.useorg}, function () {
                        $rootScope.orgStatus = true;
                        $rootScope.delOrgs = true;
                        $state.go('console.dashboard');
                    })
                })
            }
        }

        $scope.changetomember = function (idx) {
            if ($scope.rootmembers.length == 1) {
                Toast.open('最后一名管理员无法被降权')
            } else {
                //$http.put('/lapi/orgs/' + $stateParams.useorg + '/privileged', {
                //    member_name: $scope.rootmembers[idx].member_name,
                //    privileged: false
                //}).success(function (data) {
                //    //console.log('test api changetomember', data);
                //    $scope.rootmembers[idx].privileged = false;
                //    var b = $scope.rootmembers[idx];
                //    $scope.rootmembers.splice(idx, 1);
                //    //console.log('test changetomemeber', $scope.rootmembers, idx);
                //    $scope.norootmembers.push(b);
                //
                //}).error(function (err) {
                //    //Toast.open(err.message)
                //})
            }

        }

        $scope.changetoadmin = function (idx) {
            //$http.put('/lapi/orgs/' + $stateParams.useorg + '/privileged', {
            //    member_name: $scope.norootmembers[idx].member_name,
            //    privileged: true
            //}).success(function (data) {
            //    //console.log('test member', data);
            //    //  start from inx and delete one item
            //    $scope.norootmembers[idx].privileged = true;
            //    var a = $scope.norootmembers[idx];
            //    $scope.norootmembers.splice(idx, 1);
            //    //console.log('test api changetoadmin',$scope.norootmembers, idx);
            //    $scope.rootmembers.push(a);
            //})
        }
        loadOrg();
    }])

