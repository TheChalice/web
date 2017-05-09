'use strict';
angular.module('console.create_constantly_volume', [
    {
        files: []
    }
]).controller('createconvolumeCtrl', ['persistent','Tip','checkout','market','Toast','$state', '$rootScope', 'volume', '$scope',
    function (persistent,Tip,checkout,market,Toast,$state, $rootScope, volume, $scope) {
        $scope.slider = {
            value: 10,
            options: {
                floor: 10,
                ceil: 200,
                step: 10,
                showSelectionBar: true,
                showTicksValues:50,
                ticksArray: [10,50,100,150,200],
                translate: function(value, sliderId, label) {
                    switch (label) {

                        default:
                            return  value + 'GB'
                    }
                }
            }
        };

        $scope.danwei = 'GB';
        $scope.grid = {
            inved: false,
            num: false,
            dianji: false
        }
        $scope.err= {
            blank:false,
            valid:false
        }
        $scope.volume = {
            name: '',
            size: '',
            metadata: {
                annotations: {
                    'dadafoundry.io/create-by': $rootScope.namespace
                }
            }
        }
        //type=persistent_volume
        $scope.getPlan=true;
        market.get({region:$rootScope.region,type:'volume'}, function (data) {
            console.log(data.plans);
            $scope.plans = data.plans;
             $scope.getPlan=false;
        })
        $scope.$watch('slider.value', function (n, o) {
            if (n == o) {
                return
            }
            if (n && n >0) {
                $scope.grid.num=false

            }
        })
        $scope.namerr = {
            nil: false,
            rexed: false,
            repeated: false
        }
        $scope.nameblur = function () {
            //console.log($scope.buildConfig.metadata.name);
            if (!$scope.volume.name) {
                $scope.namerr.nil = true
            } else {
                $scope.namerr.nil = false
            }
        }
        $scope.namefocus = function () {
            $scope.namerr.nil = false
        }
        //secretskey.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (res) {
        //    //console.log('-------loadsecrets', res);
        //    $scope.secremnamearr=res.items;
        //
        //})
        persistent.get({
            namespace: $rootScope.namespace,
            region: $rootScope.region
        }, function (res) {
            $scope.persmnamearr=res.items;
        })

        var rex =/^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;

        $scope.$watch('volume.name', function (n, o) {
            if (n === o) {
                return;
            }
            if (n && n.length > 0) {
                if (rex.test(n)) {
                    $scope.namerr.rexed = false;
                    $scope.namerr.repeated=false;
                    if ($scope.persmnamearr) {
                        //console.log($scope.buildConfiglist);
                        angular.forEach($scope.persmnamearr, function (bsiname, i) {
                            //console.log(bsiname);
                            if (bsiname.metadata.name === n) {
                                //console.log(bsiname,n);
                                $scope.namerr.repeated = true;

                            }
                            //console.log($scope.namerr.repeated);
                        })
                    }

                } else {
                    $scope.namerr.rexed = true;
                }
            } else {
                $scope.namerr.rexed = false;
            }
        })
        $scope.empty=function(){
            if ( $scope.volume.name==='') {

                //alert(1)
                $scope.err.blank = false;
                return
            }
        }
        $scope.isEmpty=function(){
            if ( $scope.volume.name==='') {
                //alert(1)
                $scope.err.blank = true;
                return
            } else {
                $scope.err.blank = false;
            }

        }
        $scope.creat = function () {
            if (!$scope.namerr.nil && !$scope.namerr.rexed && !$scope.namerr.repeated&&!$scope.timeouted) {

            }else {
                return
            }
            var r =/^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;

            if ($scope.volume.name==='') {
                //alert(1)
                $scope.err.blank = true;
                return
            } else if (!r.test($scope.volume.name)) {
                //alert(2)
                $scope.err.valid = true;
                return
            }

            if ($scope.slider.value === 0) {
                $scope.grid.num=true;
                return
            }
            $scope.volume.size=$scope.slider.value

            angular.forEach($scope.plans, function (plan,i) {
                console.log($scope.slider.value,plan.plan_level*10);
                if ($scope.slider.value === plan.plan_level*10) {
                    $scope.plan_id = plan.plan_id;
                }
            })

            $scope.loaded = true;
            console.log($scope.plan_id);
            checkout.create({
                drytry:0,
                plan_id: $scope.plan_id,
                namespace: $rootScope.namespace,
                region:$rootScope.region,
                parameters:{
                    resource_name:$scope.volume.name
                }
            }, function (data) {
                //console.log(data);
                //volume.create({namespace: $rootScope.namespace}, $scope.volume, function (res) {
                //    //alert(11111)
                //    $scope.loaded = false;
                $state.go('console.resource_management', {index: 1});
                //}, function (err) {
                //    $scope.loaded = false;
                //    Toast.open('构建失败,请重试');
                //})

            }, function (err) {
                $scope.loaded = false;
                if (err.data.code === 3316) {
                    Tip.open('提示', '账户可用余额不足。', '充值', true).then(function () {
                        $state.go('console.pay');
                    })
                } else if(err.data.code === 3316) {
                    Tip.open('提示', '名称重复', '知道了', true).then(function () {

                    })
                }else {
                    Tip.open('提示', '支付失败,请重试', '知道了', true).then(function () {

                    })
                }

            })


        }
    }])