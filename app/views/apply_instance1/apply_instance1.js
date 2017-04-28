'use strict';
angular.module('console.apply_instance1', [
        {
            files: [
                'views/apply_instance1/apply_instance1.css'
            ]
        }
    ])
    .controller('ApplyInstanceCtrl1', ['Tip','market','checkout', 'Modalbs', '$log', '$rootScope', '$scope', 'BackingService', 'BackingServiceInstance', '$stateParams', '$state',
        function (Tip,market,checkout, Modalbs, $log, $rootScope, $scope, BackingService, BackingServiceInstance, $stateParams, $state) {
            if (!$(".zx_set_btn").hasClass("zx_set_btn_rotate")) {
                $(".create_new_nav").addClass("create_new_nav_new")
            } else {
                $(".create_new_nav").removeClass("create_new_nav_new")
            }
            BackingServiceInstance.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                console.log('bsi',res.items);
                $scope.bsinamearr=res.items;
                //angular.forEach(res.items, function (item,i) {
                //    $scope.bsinamearr.push(item.metadata.name)
                //});

            })
            $scope.allmoney=0
            $scope.slider = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 1000,
                    step: 1,
                    showSelectionBar: true,
                    showTicksValues: 1000,
                    translate: function (value, sliderId, label) {
                        switch (label) {
                            default:
                                return value + '个'
                        }
                    }
                }
            };
            $scope.sliderMer = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 60,
                    step: 1,
                    showSelectionBar: true,
                    showTicksValues: 30,
                    translate: function (value, sliderId, label) {
                        switch (label) {
                            default:
                                return value + 'GB'
                        }
                    }
                }
            };
            function rewirt(cus,i){
                console.log(cus);
                cus.rewirt = {
                    value: cus.default,
                    options: {
                        floor: cus.default,
                        ceil: cus.max,
                        step:  cus.step,
                        showSelectionBar: true,
                        showTicksValues: cus.max,
                        ticksArray: [cus.default,cus.max],
                        translate: function (value, sliderId, label) {
                            switch (label) {
                                default:
                                    //return value + cus.unit
                                    return value +' '+cus.unit
                            }
                        }
                    }
                };
            }
            $scope.wirtarr = [];
            $scope.sValueBlure = function(wir){
                //console.log(wir);
                if(wir.rewirt.value < wir.default){
                    wir.rewirt.value = wir.default
                }else if(wir.rewirt.value >wir.max){
                    wir.rewirt.value=wir.max
                }
            }
            $scope.checkedplan=0;
            market.get({region: $rootScope.region,belong:$stateParams.name}, function (data) {
                console.log('newdata', data);
                $scope.bsimoney = angular.copy(data);
                if (data.plans&&data.plans[0]) {
                    angular.forEach(data.plans, function (plan,i) {
                        if (plan.customize) {
                            $scope.checkedplan=i
                            console.log(plan.customize);
                            for(var k in plan.customize){

                                rewirt(plan.customize[k]);
                                plan.customize[k].name=k;
                                $scope.wirtarr.push(plan.customize[k])

                                //data.plans[0].customize[k].disname='slider'+k;


                                //console.log($scope.wirtarr,$scope['slider'+k]);
                            }
                            console.log($scope.wirtarr);

                        }
                    })




                }
                //$scope.data=data.plans;
            })
            $scope.bsi  = {
                metadata: {
                    name: ''
                },
                spec: {
                    provisioning: {
                        backingservice_name: '',
                        backingservice_spec_id: '',
                        backingservice_plan_guid: ''
                    }
                }
            };
            $scope.namerr= {
                null:true,
                rexed:false,
                repeated:false,
                bigcode:false
            }
            var dcnamer = /^[a-z]([a-z0-9]{0,22}\-{0,1})?[a-z0-9]$/;
            $scope.$watch('bsi.metadata.name', function (n,o) {
                if (n === o) {
                    return
                }
                $scope.namerr.null=false
                $scope.namerr.rexed = false;
                $scope.namerr.repeated = false;
                $scope.namerr.bigcode = false;
                // console.log($scope.buildConfig.metadata.name);
                var str = n;
                if (n) {
                    if (/[a-z]/.test(str.charAt(0))) {
                        //alert(11)
                        if (dcnamer.test(n) || n == '') {
                            angular.forEach($scope.bsinamearr, function (build,k) {
                                //angular.forEach($scope.serviceNameArr, function (build, i) {
                                if (build.metadata.name === n) {
                                    $scope.namerr.repeated = true;
                                }
                            })
                            //})
                        } else {
                            $scope.namerr.rexed = true;
                        }

                    }else {

                        $scope.namerr.bigcode = true;
                    }
                }


            })

            $scope.$watch('wirtarr', function (n,o) {
                if (n === o) {
                    return
                }
                if (n) {

                    $scope.allmoney=$scope.bsimoney.plans[0].price;
                    angular.forEach(n, function (item,i) {
                        //console.log(item.rewirt.price);
                        $scope.allmoney=$scope.allmoney+item.price*((item.rewirt.value-item.default)/item.step)
                        if ($scope.allmoney < 0) {
                            $scope.allmoney=0
                        }else if(!$scope.allmoney){
                            $scope.allmoney=0
                        }
                    })
                    //$scope.allmoney=node.price*((n.node-node.default)/node.step)+storage.price*((n.storage-storage.default)/storage.step)
                    //console.log($scope.allmoney);
                }
            },true);
            $scope.create= function () {
                //{"parameters": {
                //    "resource_name": "rmqqq",
                //        "customize": {
                //        "param1":"value1",
                //            "param2":"value2"
                //    }
                //}
                //}
                var customize={}
                angular.forEach($scope.wirtarr,function(item,i){
                    customize[item.name] = item.rewirt.value;
                })
                checkout.create({
                    drytry: 0,
                    plan_id: $scope.bsimoney.plans[$scope.checkedplan].plan_id,
                    namespace: $rootScope.namespace,
                    region: $rootScope.region,
                    parameters: {
                        resource_name: $scope.bsi.metadata.name,
                        "customize":customize

                    }
                }, function (data) {
                    //$scope.applyloaded=false;
                    //console.log(data);
                    //volume.create({namespace: $rootScope.namespace}, $scope.volume, function (res) {
                    //    //alert(11111)
                    //    $scope.loaded = false;
                    //$state.go('console.resource_management', {index: 1});
                    $state.go('console.backing_service_detail', {name: $stateParams.name, index: 2})
                    //}, function (err) {
                    //    $scope.loaded = false;
                    //    Toast.open('构建失败,请重试');
                    //})

                }, function (err) {
                    $scope.applyloaded=false
                    if (err.data.code === 3316) {

                        Tip.open('提示', '账户可用余额不足。', '充值', true).then(function () {
                            $state.go('console.pay');
                        })
                    } else {

                        Tip.open('提示', '支付失败,请重试', '知道了', true).then(function () {

                        })
                    }

                })
            }

            // $scope.grid = {
            //     checked: $stateParams.index,
            //     error: false
            // };
            //
            // $scope.bsi = {
            //     metadata: {
            //         name: ''
            //     },
            //     spec: {
            //         provisioning: {
            //             backingservice_name: '',
            //             backingservice_spec_id: '',
            //             backingservice_plan_guid: ''
            //         }
            //     }
            // };
            // $scope.bsName = $stateParams.name;
            // //console.log('@@@test bsname', $stateParams.name);
            // var loadBs = function () {
            //     //console.log("$state", $stateParams.plan)
            //     market.get({region: $rootScope.region,belong:$scope.bsName}, function (data) {
            //         console.log('newdata', data);
            //         $scope.data=data.plans;
            //     })
            //
            // };
            // loadBs();
            // BackingServiceInstance.get({
            //     namespace: $rootScope.namespace,
            //     region: $rootScope.region
            // }, function (res) {
            //     console.log('bsi',res.items);
            //     $scope.bsinamearr=res.items;
            //     //angular.forEach(res.items, function (item,i) {
            //     //    $scope.bsinamearr.push(item.metadata.name)
            //     //});
            //
            // })
            // $scope.namerr = {
            //     nil: false,
            //     rexed: false,
            //     repeated: false
            // }
            // $scope.nameblur = function () {
            //     //console.log($scope.buildConfig.metadata.name);
            //     if (!$scope.bsi.metadata.name) {
            //         $scope.namerr.nil = true
            //     } else {
            //         $scope.namerr.nil = false
            //     }
            // }
            // $scope.namefocus = function () {
            //     $scope.namerr.nil = false
            // }
            //
            //
            // var r =/^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;
            // $scope.$watch('bsi.metadata.name', function (n, o) {
            //     if (n === o) {
            //         return;
            //     }
            //     if (n && n.length > 0) {
            //         if (r.test(n)) {
            //             $scope.namerr.rexed = false;
            //             $scope.namerr.repeated=false;
            //             if ($scope.bsinamearr) {
            //                 //console.log($scope.buildConfiglist);
            //                 angular.forEach($scope.bsinamearr, function (bsiname, i) {
            //                     //console.log(bsiname);
            //                     if (bsiname.metadata.name === n) {
            //                         //console.log(bsiname,n);
            //                         $scope.namerr.repeated = true;
            //
            //                     }
            //                     //console.log($scope.namerr.repeated);
            //                 })
            //             }
            //
            //         } else {
            //             $scope.namerr.rexed = true;
            //         }
            //     } else {
            //         $scope.namerr.rexed = false;
            //     }
            // })
            //
            // $scope.createInstance = function (name) {
            //     if (!$scope.namerr.nil && !$scope.namerr.rexed && !$scope.namerr.repeated) {
            //
            //     }else {
            //         return
            //     }
            //     var plan = $scope.data[$scope.grid.checked];
            //
            //     Modalbs.open($scope.bsName, plan).then(function () {
            //         $log.info("BackingServiceInstance", $scope.bsi);
            //         $scope.applyloaded=true
            //         checkout.create({
            //             drytry: 0,
            //             plan_id: plan.plan_id,
            //             namespace: $rootScope.namespace,
            //             region: $rootScope.region,
            //             parameters: {
            //                 resource_name: $scope.bsi.metadata.name
            //             }
            //         }, function (data) {
            //             $scope.applyloaded=false;
            //             //console.log(data);
            //             //volume.create({namespace: $rootScope.namespace}, $scope.volume, function (res) {
            //             //    //alert(11111)
            //             //    $scope.loaded = false;
            //             //$state.go('console.resource_management', {index: 1});
            //             $state.go('console.backing_service_detail', {name: $scope.bsName, index: 2})
            //             //}, function (err) {
            //             //    $scope.loaded = false;
            //             //    Toast.open('构建失败,请重试');
            //             //})
            //
            //         }, function (err) {
            //             $scope.applyloaded=false
            //             if (err.data.code === 3316) {
            //
            //                 Tip.open('提示', '账户可用余额不足。', '充值', true).then(function () {
            //                     $state.go('console.pay');
            //                 })
            //             } else {
            //
            //                 Tip.open('提示', '支付失败,请重试', '知道了', true).then(function () {
            //
            //                 })
            //             }
            //
            //         })
            //         //BackingServiceInstance.create({namespace: $rootScope.namespace,region:$rootScope.region}, $scope.bsi,function(){
            //         //    $scope.grid.error=false
            //         //    $log.info("build backing service instance success");
            //         //    $state.go('console.backing_service_detail', {name: $scope.data.metadata.name, index:2})
            //         //}, function (data) {
            //         //    if (data.status === 409) {
            //         //        $scope.grid.error=true
            //         //    }
            //         //})
            //     })
            //
            //
            // };

        }]);
