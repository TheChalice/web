'use strict';
angular.module('console.dashboard', [
        {
            files: []
        }
    ])
    .controller('dashboardCtrl', ['checkout','resourcequotas','Project', 'recharge', 'balance', '$http', '$log', '$rootScope', '$scope', 'Metrics', 'MetricsService', 'Pod', 'DeploymentConfig', 'BackingServiceInstance', 'account', 'market',
        function (checkout,resourcequotas,Project, recharge, balance, $http, $log, $rootScope, $scope, Metrics, MetricsService, Pod, DeploymentConfig, BackingServiceInstance, account, market) {
            $scope.cpuData = [];
            $scope.memData = [];
            $scope.isdata = {};
            //$scope.deposit = function () {
            //    recharge.create({}, {"amount": 1234.34, namespace: $rootScope.namespace}, function (data) {
            //        console.log('充值', data);
            //    })
            //}
            $scope.$watch('namespace', function (n,o) {
                if (n === o) {
                    return
                }
                if (n !== "") {
                    loadProject()
                }

            })
            var loadProject = function () {
                //$log.info("load project");
                Project.get({region: $rootScope.region}, function (data) {
                    angular.forEach(data.items, function (item, i) {
                        if (item.metadata.name === $rootScope.namespace) {
                            $scope.projectname = item.metadata.annotations['openshift.io/display-name'] === '' ? item.metadata.name : item.metadata.annotations['openshift.io/display-name'];
                        }
                    })
                    //$scope.projectname =
                    //$log.info("project", data);
                }, function (res) {
                    $log.info("find project err", res);
                });
            };

            Project.get({region: $rootScope.region}, function (data) {
                //$rootScope.projects = data.items;
                //console.log('Project', Project);
                //var newprojects = [];
                angular.forEach(data.items, function (item, i) {
                    if (item.metadata.name === $rootScope.namespace) {
                        $scope.projectname = item.metadata.annotations['openshift.io/display-name'] === '' ? item.metadata.name : item.metadata.annotations['openshift.io/display-name'];
                    }
                    if ($rootScope.user.metadata && item.metadata.name === $rootScope.user.metadata.name) {
                        data.items.splice(i, 1);
                    } else {
                        data.items[i].sortname = item.metadata.annotations['openshift.io/display-name'] || item.metadata.name;
                    }

                })
                data.items.sort(function (x, y) {
                    return x.sortname > y.sortname ? 1 : -1;
                });
                angular.forEach(data.items, function (project, i) {
                    if (/^[\u4e00-\u9fa5]/i.test(project.metadata.annotations['openshift.io/display-name'])) {
                        //console.log(project.metadata.annotations['openshift.io/display-name']);
                        //data.items.push(project);
                        data.items.unshift(project);

                        data.items.splice(i + 1, 1);
                    }
                });
                $rootScope.projects = data.items;
                //console.log(data.items);


                //$log.info("load project success", data);
            }, function (res) {
                $log.info("find project err", res);
            });
            $scope.plans = {
                cpu: "",
                ram: "",
                price: null,
                planName: null
            }
            account.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region,
            }, function (reso) {

                if (!reso.subscriptions) {
                    checkout.create({
                        drytry:0,
                        plan_id: '91115647-BB07-0F08-8C7B-2C66F3B2806A',
                        namespace: $rootScope.namespace,
                        region:$rootScope.region
                    }, function (data) {
                        console.log('data', data);
                        account.get({
                            namespace: $rootScope.namespace,
                            region: $rootScope.region,
                        }, function (res) {
                            $scope.balance=res.balance
                            console.log('accountall',reso);
                            market.get({region: $rootScope.region, type: 'resources'}, function (data) {
                                //console.log('eeeeeeeeeeee',data);
                                if (res.subscriptions.length > 1) {
                                    account.get({
                                        namespace: $rootScope.namespace,
                                        region: $rootScope.region,
                                        status:"consuming"
                                    }, function (resin) {
                                        angular.forEach(resin.subscriptions, function (item, k) {
                                            if (item.type === "resources") {
                                                angular.forEach(data.plans, function (plan, i) {
                                                    if (item.plan_id === plan.plan_id) {
                                                        $scope.plans.cpu =plan.description;
                                                        $scope.plans.ram = plan.description2;
                                                        $scope.plans.price = plan.price
                                                        $scope.plans.planName = plan.plan_name;

                                                    }
                                                })
                                            }

                                        })
                                    })
                                }else {

                                    $scope.plans.cpu =res.subscriptions[0].description;
                                    $scope.plans.ram = res.subscriptions[0].description2;
                                    $scope.plans.price = res.subscriptions[0].price
                                    $scope.plans.planName = res.subscriptions[0].plan_name;

                                }



                                //for(var i = 0 ; i < data.plans.length; i++){
                                //
                                //    if(res.subscriptions&&res.subscriptions[0].plan_id === data.plans[i].plan_id){
                                //        $scope.plans.cpu = data.plans[i].description;
                                //        $scope.plans.ram = data.plans[i].description2;
                                //        $scope.plans.price = data.plans[i].price
                                //        $scope.plans.planName = data.plans[i].plan_name;
                                //    }
                                //}

                            })
                        })
                    })
                }else {
                    $scope.balance=reso.balance;
                    market.get({region: $rootScope.region, type: 'resources'}, function (data) {
                        //console.log('eeeeeeeeeeee',data);

                        if (reso.subscriptions.length > 1) {
                            account.get({
                                namespace: $rootScope.namespace,
                                region: $rootScope.region,
                                status:"consuming"
                            }, function (resin) {
                                angular.forEach(resin.subscriptions, function (item, k) {
                                    if (item.type === "resources") {
                                        angular.forEach(data.plans, function (plan, i) {
                                            if (item.plan_id === plan.plan_id) {
                                                $scope.plans.cpu =plan.description;
                                                $scope.plans.ram = plan.description2;
                                                $scope.plans.price = plan.price
                                                $scope.plans.planName = plan.plan_name;

                                            }
                                        })
                                    }

                                })
                            })
                        }else {

                            $scope.plans.cpu =reso.subscriptions[0].description;
                            $scope.plans.ram = reso.subscriptions[0].description2;
                            $scope.plans.price = reso.subscriptions[0].price
                            $scope.plans.planName = reso.subscriptions[0].plan_name;
                            console.log('$scope.plans',$scope.plans);
                        }



                        //for(var i = 0 ; i < data.plans.length; i++){
                        //
                        //    if(res.subscriptions&&res.subscriptions[0].plan_id === data.plans[i].plan_id){
                        //        $scope.plans.cpu = data.plans[i].description;
                        //        $scope.plans.ram = data.plans[i].description2;
                        //        $scope.plans.price = data.plans[i].price
                        //        $scope.plans.planName = data.plans[i].plan_name;
                        //    }
                        //}

                    })
                    $scope.balance=reso.balance
                }
                //$scope.balance=res.balance;



            })

            //balance.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
            //    $scope.balance = data
            //    //console.log('balance', data);
            //});

            var setChart = function () {
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
                        credits: {
                            enabled: false
                        },
                        tooltip: {
                            backgroundColor: '#666',
                            borderWidth: 0,
                            shadow: false,
                            style: {
                                color: '#fff'
                            }
                        },
                        legend: {
                            enabled: false
                        }
                    },
                    series: [{
                        name: 'cpu',
                        fillColor: {
                            linearGradient: { x1: 0, y1:1 , x2: 0, y2: 0 }, //横向渐变效果 如果将x2和y2值交换将会变成纵向渐变效果
                            stops: [
                                [0, Highcharts.Color('#fff').setOpacity(0.8).get('rgba')],
                                [1, '#4ca7de']
                            ]
                        },
                        lineColor:'#fff',
                        fillOpacity: 0.6,
                        marker: {
                            enabled: false
                        },
                        yAxis: 1,
                        data: $scope.cpuData,
                        pointStart: (new Date()).getTime() + 3600 * 1000,
                        pointInterval: 15 * 60 * 1000 //时间间隔
                    },
                        {
                            name: '内存',
                            fillColor: {
                                linearGradient: { x1: 0, y1:1 , x2: 0, y2: 0 }, //横向渐变效果 如果将x2和y2值交换将会变成纵向渐变效果
                                stops: [
                                     [0, Highcharts.Color('#36a390').setOpacity(0.8).get('rgba')],
                                     [1, '#79d87e']
                                    ]
                            },
                            lineColor:'#fff',
                            fillOpacity: 0.6,
                            marker: {
                                enabled: false
                            },
                            yAxis: 0,
                            data: $scope.memData,
                            pointStart: (new Date()).getTime() + 3600 * 1000,
                            pointInterval: 15 * 60 * 1000 //时间间隔
                        }],
                    xAxis: {
                        // categories: ['12:00','14:00', '16:00', '18:00', '20:00', '22:00', '24:00'],
                        type: 'datetime',
                        gridLineWidth: 1
                    },
                    yAxis: [{
                        // gridLineDashStyle: 'ShortDash',
                        title: {
                            text: '内存 (M)',
                            style: {
                                color: '#bec0c7'
                            }
                        }

                    }, {
                        // gridLineDashStyle: 'ShortDash',
                        title: {
                            text: 'CPU (%)',
                            style: {
                                color: '#f6a540'
                            }
                        },
                        opposite: true
                    }],
                    size: {
                        height: 230,
                        width: 950
                    },
                    func: function (chart) {
                        //setup some logic for the chart
                    }
                };
            };

            var setPieChart = function (tp, dec, percent, quota, color) {
                var percentstr = '';
                if (quota == true) {
                    // percentstr = '<b style="color:#5a6378;">已用' + percent + '%</b>';
                    //已用
                    percentstr = '<b style="color:#5a6378; font-size: 14px">已用' + percent + '%</b>';
                }
                //配额
                var subTitle = '<b style="font-size:14px;color:#f6a540;">' + tp + '</b><br>' +
                        '<span style="color:#9fa7b7; font-size:14px;">' + dec + '</span><br>' + percentstr
                    ;
                return {
                    options: {
                        chart: {
                            type: 'pie'
                        },
                        "plotOptions": {
                            "series": {
                                "stacking": "",
                                linecap: 'square'
                            }
                        },
                        title: {
                            text: ''
                        },
                        tooltip: {
                            enabled: false
                        },
                        credits: {
                            enabled: false
                        },
                        subtitle: {
                            text: subTitle,
                            style: {
                                lineHeight: '20px'
                            },
                            align: 'center',
                            verticalAlign: 'middle',
                            x: 0,
                            y: -10

                        }


                    },

                    series: [{
                        type: 'pie',
                        colors: [{
                            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 }, //横向渐变效果 如果将x2和y2值交换将会变成纵向渐变效果
                            stops: [
                                [0, Highcharts.Color('#469450').setOpacity(1).get('rgba')],
                                [1, Highcharts.Color('#2196f3').setOpacity(1).get('rgba')]
                            ]}, '#c6c6c6'],
                        data: [
                            ['已用', percent],
                            ['未使用', 100 - percent]
                        ],
                        dataLabels: {
                            enabled: false
                        },
                        innerSize: '70%'
                    }],
                    size: {
                        height: 200,
                        width: 200
                    },

                    func: function (chart) {
                        //setup some logic for the chart

                        //chart.attr({
                        //            'stroke': '#303030',
                        //            'stroke-linecap': 'round',
                        //            'stroke-linejoin': 'round',
                        //            'stroke-width': 2,
                        //            'zIndex': 10
                        //        })
                        //this.renderer.path(['M', -8, 0, 'L', 8, 0, 'M', 0, -8, 'L', 8, 0, 0, 8])
                        //    .attr({
                        //        'stroke': '#303030',
                        //        'stroke-linecap': 'round',
                        //        'stroke-linejoin': 'round',
                        //        'stroke-width': 2,
                        //        'zIndex': 10
                        //    })
                        //    .translate(190, 26)
                        //    .add(this.series[2].group);
                    }
                };
            };

            // console.log((new Date()).getTime()-8 * 3600 * 1000);
            var prepareData = function (tp, data) {
                var res = [];
                MetricsService.normalize(data, tp);
                for (var i = 0; i < data.length - 1; i++) {
                    res.push(data[i].value);
                }
                return res;
            };
            var toDecimal = function (x) {
                var f = parseFloat(x);
                if (isNaN(f)) {
                    return;
                }
                f = Math.round(x * 10000) / 10000;
                return f;
            }

            Metrics.cpu.all.query({
                tags: 'descriptor_name:cpu/usage,pod_namespace:' + $rootScope.namespace,
                buckets: 30
            }, function (res) {
                $log.info('metrics cpu all', res);
                $scope.cpuData = prepareData('CPU', res);

                angular.forEach($scope.cpuData, function (item, i) {


                    if (item == null) {
                        $scope.cpuData[i] = 0
                    } else {
                        $scope.cpuData[i] = Math.round(item * 10000) / 10000
                    }
                })
                // console.log('$scope.cpuData',$scope.cpuData)
                Metrics.mem.all.query({
                    tags: 'descriptor_name:memory/usage,pod_namespace:' + $rootScope.namespace,
                    buckets: 30
                }, function (res) {
                    $log.info('metrics mem all', res);
                    $scope.memData = prepareData('内存', res);
                    angular.forEach($scope.memData, function (item, i) {
                        if (item == null) {
                            $scope.memData[i] = 0
                        } else {
                            $scope.memData[i] = Math.round(item * 10000) / 10000
                        }
                    })
                    //$scope.memData
                    // console.log('$scope.memData',$scope.memData)
                    resourcequotas.get({namespace: $rootScope.namespace,region:$rootScope.region}, function (data) {
                        if (data.items[0]) {
                            // console.log($scope.cpuData);
                            // console.log($scope.memData);
                            parseInt(data.items[0].spec.hard['limits.memory'])
                            var cpu = [];
                            var cpusun = 0;
                            var mem = [];
                            var memsun = 0;
                            for (var i = 0; i < $scope.cpuData.length; i++) {
                                if ($scope.cpuData[i] != 0) {
                                    cpu.push($scope.cpuData[i])
                                }
                                if ($scope.memData[i] != 0) {
                                    mem.push($scope.memData[i])
                                }
                            }
                            for (var q = 0; q < cpu.length; q++) {
                                cpusun += cpu[q]
                            }
                            for (var w = 0; w < mem.length; w++) {
                                memsun += mem[w]
                            }
                            // console.log(cpusun,memsun)
                            // var cpunum = 0
                            // var memnum = 0
                            // if (cpu.length && mem.length) {
                            //   cpunum = cpusun / cpu.length / 500 * 100;
                            //   memnum = memsun / mem.length / 1000000 / 250 * 100;
                            //   cpunum = toDecimal(cpunum);
                            //   memnum = toDecimal(memnum);
                            // }

                            // console.log(cpunum,memnum)
                            //quotaed
                            var userd = {
                                usedM: parseInt(data.items[0].status.used['limits.memory']),
                                usedC: parseInt(data.items[0].status.used['limits.cpu']),
                                headM: parseInt(data.items[0].status.hard['limits.memory']) * 1000,
                                headC: parseInt(data.items[0].status.hard['limits.cpu']) * 1000,
                            }

                            //console.log('数据', data);
                            //console.log(userd.headC, userd.headM);
                            //console.log(userd.usedC, userd.usedM);
                            userd.usedM = userd.usedM > userd.headM ? userd.headM : userd.usedM;
                            userd.usedC = userd.usedC > userd.headC ? userd.headC : userd.usedC;
                            //console.log(userd.headC, userd.headM);
                            //console.log(userd.usedC, userd.usedM);

                            var memnums = (userd.usedM / userd.headM) * 100;
                            var cpunums = (userd.usedC / userd.headC) * 100;
                            //console.log(memnums,cpunums);
                            memnums = Math.round(memnums * 100) / 100
                            cpunums = Math.round(cpunums * 100) / 100
                            // data.items[0].status.hard['limits.cpu']
                            // console.log(data.items[0].status.used['limits.memory'],data.items[0].status.used['limits.cpu']);
                            // console.log(data.items[0].status.hard['limits.memory'],data.items[0].status.hard['limits.cpu']);
                            if (memnums == 100 || cpunums == 100) {
                                if (memnums == 100 && cpunums != 100) {
                                    $scope.pieConfigMem = setPieChart('内存', data.items[0].spec.hard['limits.memory'], memnums, true, 'red');
                                    $scope.pieConfigCpu = setPieChart('CPU', data.items[0].spec.hard['limits.cpu'] + 'G/Hz', cpunums, true, '#f6a540');
                                } else if (cpunums == 100 && memnums != 100) {
                                    $scope.pieConfigCpu = setPieChart('CPU', data.items[0].spec.hard['limits.cpu'] + 'G/Hz', cpunums, true, 'red');
                                    $scope.pieConfigMem = setPieChart('内存', data.items[0].spec.hard['limits.memory'], memnums, true, '#f6a540');
                                } else {
                                    $scope.pieConfigCpu = setPieChart('CPU', data.items[0].spec.hard['limits.cpu'] + 'G/Hz', cpunums, true, 'red');
                                    $scope.pieConfigMem = setPieChart('内存', data.items[0].spec.hard['limits.memory'], memnums, true, 'red');

                                }

                            } else {
                                $scope.pieConfigMem = setPieChart('内存', data.items[0].spec.hard['limits.memory'], memnums, true, '#f6a540');
                                $scope.pieConfigCpu = setPieChart('CPU', data.items[0].spec.hard['limits.cpu'] + 'G/Hz', cpunums, true, '#f6a540');
                            }
                            // $scope.pieConfigCpu = setPieChart('CPU', data.items[0].spec.hard['limits.cpu']+'GB', cpunums, true,'#f6a540');
                            $scope.chartConfig = setChart();
                            $scope.isdata.CpuorMem = true;
                            $scope.isdata.charts = true;

                        } else {
                            //console.log('配额',data);
                            var cpu = [];
                            var cpusun = 0;
                            var mem = [];
                            var memsun = 0;
                            for (var i = 0; i < $scope.cpuData.length; i++) {
                                if ($scope.cpuData[i] != null) {
                                    cpu.push($scope.cpuData[i])
                                }
                                // console.log($scope.cpuData[i],$scope.memData[i])
                                if ($scope.memData[i] != null) {
                                    mem.push($scope.memData[i])
                                }
                            }
                            // console.log(cpu,mem)
                            for (var q = 0; q < cpu.length; q++) {
                                cpusun += cpu[q]
                            }
                            for (var w = 0; w < mem.length; w++) {
                                memsun += mem[w]
                            }
                            // console.log(cpusun, memsun)
                            if (cpusun || memsun) {
                                // var cpunum = cpusun / cpu.length / 500 * 100 || 0;
                                // var memnum = memsun / mem.length / 1000000 / 250 * 100 || 0
                                var cpunum = cpusun / cpu.length || 0;
                                var memnum = memsun / mem.length / 1000000 || 0

                                cpunum = toDecimal(cpunum);
                                memnum = toDecimal(memnum);
                                memnum = Math.round(memnum * 100) / 100;
                                cpunum = Math.round(cpunum * 100) / 100;
                                //console.log(memnum);


                                // console.log(cpunum,memnum);
                                // $scope.pieConfigCpu = setPieChart('CPU', '500m', cpunum);
                                // $scope.pieConfigMem = setPieChart('内存', '250Mi', memnum);
                                //no quota.

                                $scope.pieConfigCpu = setPieChart('CPU', cpunum + '%', 0, false);
                                $scope.pieConfigMem = setPieChart('内存', memnum + 'MB', 0, false);

                                $scope.chartConfig = setChart();
                                $scope.isdata.CpuorMem = true;
                                $scope.isdata.charts = true;
                            } else {
                                //no quota, no usage.
                                $scope.pieConfigCpu = setPieChart('CPU', 'N/A', 0);
                                $scope.pieConfigMem = setPieChart('内存', 'N/A', 0);
                                $scope.chartConfig = setChart();
                                $scope.isdata.CpuorMem = true;
                                $scope.isdata.charts = true;
                            }

                        }
                    }, function (err) {
                        $scope.pieConfigCpu = setPieChart('CPU', 'N/A', 0);
                        $scope.pieConfigMem = setPieChart('内存', 'N/A', 0);
                    })

                }, function (res) {
                    $log.info('metrics mem all err', res);
                    $scope.pieConfigCpu = setPieChart('CPU', 'N/A', 0);
                    $scope.pieConfigMem = setPieChart('内存', 'N/A', 0);
                });

            }, function (res) {
                $log.info('metrics cpu all err', res);
                $scope.isdata.CpuorMem = true;
                $scope.isdata.charts = false;
                $scope.pieConfigCpu = setPieChart('CPU', 'N/A', 0);
                $scope.pieConfigMem = setPieChart('内存', 'N/A', 0);
            });

            $scope.isdata.CpuorMem = true;
            $scope.isdata.charts = false;
            $scope.pieConfigCpu = setPieChart('CPU', 'loading...', 0.1);
            $scope.pieConfigMem = setPieChart('内存', 'loading...', 0.1);
            $scope.podList = 0;
            var podList = function () {
                Pod.get({namespace: $scope.namespace, region: $rootScope.region}, function (res) {
                    //console.log("pod...res....", res);
                    for (var i = 0; i < res.items.length; i++) {
                        if (res.items[i].status.phase == 'Running') {
                            $scope.podList++;
                        }
                    }
                }, function (res) {
                    //console.log("pod...reserr....", res);
                })
            }

            var dcList = function () {
                DeploymentConfig.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
                    $log.info('dcList----', data);
                    $scope.dcList = data.items.length;
                }, function (res) {
                    $log.info('dcListerr', res);
                    $scope.dcList = 0;
                    //todo ������
                });
            }
            var bsiList = function () {
                BackingServiceInstance.get({
                    namespace: $rootScope.namespace,
                    region: $rootScope.region
                }, function (res) {
                    //console.log("bsiList......", res);
                    $scope.bsiList = res.items.length;
                }, function (res) {
                    //console.log("bsiList...bsiListerr....", res);
                    $scope.bsiList = 0;
                })
            }
            podList();
            dcList();
            bsiList();

        }]);

