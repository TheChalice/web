'use strict';

angular.module('console', [
        {
            files: [
                'components/header/header.js',
                'components/sidebar/sidebar.js',
                'views/console/console.css'
            ]
        }
    ])
    .controller('ConsoleCtrl', ['creatproject','newuser','$timeout', 'sessiontoken', 'regions', 'account', '$http', '$rootScope', '$scope', '$log', 'AUTH_EVENTS', 'User', 'user', 'Project', 'Cookie', '$state',
        function (creatproject,newuser,$timeout, sessiontoken, regions, account, $http, $rootScope, $scope, $log, AUTH_EVENTS, User, user, Project, Cookie, $state) {
            //$('html').css('overflow', 'auto');
            //sessiontoken.get({},function (user) {
            //    console.log(user);
            //
            //})

            if ($rootScope.user) {
                console.log('$rootScope.user', $rootScope.user.metadata.name);
            } else {
                $rootScope.user = user;
            }
            $log.info('Console', $state.current.name);
            var namespace = Cookie.get('namespace');
            var region = Cookie.get('region');
            if (region) {
                $rootScope.region = region;
            } else {
                console.log('noregion');
                $rootScope.region = 'cn-north-1';
                Cookie.set('region', $rootScope.region, 10 * 365 * 24 * 3600 * 1000);
            }

            if (namespace) {
                $rootScope.namespace = namespace;
            } else {
                //console.log('nonamespace');
                $rootScope.namespace = $rootScope.user.metadata.name;
                Cookie.set('namespace', $rootScope.namespace, 10 * 365 * 24 * 3600 * 1000);
            }

            //console.log('creatproject.user', $rootScope.user.metadata.name);
            creatproject.create({'metadata': {
                name:$rootScope.user.metadata.name
            }}, function (res) {
                //console.log('creatproject', $rootScope.user.metadata.name);
                loadProject();
            }, function (err) {
                loadProject();
            })

            var loadProject = function () {
                //$log.info("load project");
                Project.get({region: $rootScope.region}, function (data) {
                    //$rootScope.projects = data.items;
                    //console.log('consoleProject', data);
                    //var newprojects = [];
                    angular.forEach(data.items, function (item, i) {
                        //console.log($rootScope.user.metadata.name);

                            data.items[i].sortname = item.metadata.annotations['openshift.io/display-name'] || item.metadata.name;


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
            };




            //var timer = $timeout(
            //    function () {
            //        account.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
            //            console.log('套餐', data);
            //            if (data.purchased) {
            //                //跳转dashboard
            //
            //            } else {
            //                if ($state.current.name === 'console.plan' || $state.current.name === 'console.pay' || $state.current.name === 'console.noplan') {
            //
            //                } else {
            //
            //                    $state.go('console.noplan');
            //                }
            //
            //                //跳转购买套餐
            //            }
            //        })}, 2000);
            //
            //$scope.$on("$destroy", function (event) {
            //    $timeout.cancel(timer);
            //}
            //);

            if ($state.current.name === 'console.plan' || $state.current.name === 'console.pay' || $state.current.name === 'console.noplan') {
                $rootScope.showsidebar = false;
                $('#sidebar-right-fixed').css("marginLeft", 0)
            } else {
                $rootScope.showsidebar = true;
                $('#sidebar-right-fixed').css("marginLeft", 168)
            }
            //console.log($scope.showsidebar);


            //account.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
            //    //console.log('套餐', data);
            //    loadProject();
            //    if (data.purchased) {
            //        //跳转dashboard
            //        $scope.showsidebar = true;
            //
            //    } else {
            //        if ($state.current.name === 'console.plan' || $state.current.name === 'console.pay' || $state.current.name === 'console.noplan' || $state.current.name === 'home.index') {
            //            //$rootScope.projects=false;
            //            $rootScope.showsidebar = false;
            //        } else {
            //            $state.go('console.noplan');
            //        }
            //
            //
            //        //跳转购买套餐
            //    }
            //})

            //$rootScope.user = user;


            //$scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            //    //console.log('toState.name', toState.name);
            //    account.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
            //        //console.log('套餐', data);
            //        //$rootScope.payment=data;
            //        if ($state.current.name === 'console.plan' || $state.current.name === 'console.pay' || $state.current.name === 'console.noplan' || $state.current.name === 'home.index') {
            //            $rootScope.showsidebar = false;
            //        } else {
            //            $rootScope.showsidebar = true;
            //        }
            //        if (data.purchased) {
            //            loadProject();
            //            //$scope.showsidebar = true;
            //
            //            //有plan
            //        } else {
            //            if (toState.name === 'console.plan' || toState.name === 'console.pay' || toState.name === 'console.noplan' || toState.name === 'home.index') {
            //                //$rootScope.projects=false;
            //                //$scope.showsidebar = false;
            //            } else {
            //                $state.go('console.noplan');
            //            }
            //
            //            //跳转购买套餐
            //        }
            //    })
            //
            //
            //})
            //$rootScope.payment = account;


            //loadProject();
        }]);

