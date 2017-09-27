'use strict';

define(['angular'], function (angular) {
    return angular.module('myApp.controller', [])
        .controller('AppCtrl', ['User','$rootScope', '$state', '$log', 'AUTH_EVENTS', 'Cookie',
            function (User,$rootScope, $state, $log, AUTH_EVENTS, Cookie) {
            //console相关全局变量
            $rootScope.console = {};

            $rootScope.$on(AUTH_EVENTS.loginNeeded, function () {
                $log.info(AUTH_EVENTS.loginNeeded);
                //User.get({name: '~', region: Cookie.get('region')}, function (user) {
                //    //console.log('user', user);
                //    $rootScope.user = user;
                //    $rootScope.namespace = user.metadata.name;
                //    Cookie.set('namespace', $rootScope.namespace, 10 * 365 * 24 * 3600 * 1000);
                //    $rootScope.region = 'cn-north-1';
                //    Cookie.set('region', $rootScope.region, 10 * 365 * 24 * 3600 * 1000);
                //    $state.go('console.dashboard');
                //})
                Cookie.clear('namespace');
                Cookie.clear('df_access_token');
                Cookie.clear('region');
                $rootScope.region = '';
                $rootScope.user = '';
                $rootScope.namespace = "";
                $state.go('login');
            });
            $rootScope.$on(AUTH_EVENTS.loginSuccess, function () {
                $log.info(AUTH_EVENTS.loginSuccess);
            });
            $rootScope.$on(AUTH_EVENTS.httpForbidden, function () {
                $log.info(AUTH_EVENTS.httpForbidden);
                Cookie.clear('namespace');
                Cookie.clear('df_access_token');
                Cookie.clear('region');
                $rootScope.region = '';
                $rootScope.user = '';
                $rootScope.namespace = "";
                $state.go('login');
                //Cookie.clear('namespace');
                //Cookie.clear('df_access_token');
                //Cookie.clear('region');
                //$rootScope.region = '';
                //$rootScope.user = '';
                //$rootScope.namespace = "";
                //$state.go('home.index');
            });
        }]);
});
