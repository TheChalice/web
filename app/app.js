'use strict';

define([
    'angular',
    'bootstrap',
    'ocLazyLoad',
    'uiBootstrap',
    'angularAnimate',
    'router',
    'resource',
    'pub/controller',
    'pub/service',
    'pub/directive',
    'pub/filter',
    'pub/ws',
    'components/version/version'
], function (angular) {

    // 声明应用及其依赖
    var myApp = angular.module('myApp', [
        'oc.lazyLoad',
        'ui.bootstrap',
        'ngAnimate',
        'myApp.router',     //路由模块
        'myApp.resource',   //资源模块
        'myApp.controller',
        'myApp.service',
        'myApp.directive',
        'myApp.filter',
        'myApp.webSocket',
        'myApp.version'
    ]);

    myApp.constant('GLOBAL', {
        size: 10,
        host: 'https://54.222.199.235:8443/oapi/v1',
        host_wss: 'wss://54.222.199.235:8443/oapi/v1',
        namespace: 'foundry'
    })
    .constant('AUTH_EVENTS', {
        loginNeeded: 'auth-login-needed',
        loginSuccess: 'auth-login-success',
        httpForbidden: 'auth-http-forbidden'
    })
    .constant('AUTH_CFG', {
        oauth_authorize_uri: "https://lab.asiainfodata.com:8443/oauth/authorize",
        //oauth_redirect_base: "http://localhost:8080/console",
        oauth_redirect_base: "https://lab.asiainfodata.com:8443/console",
        oauth_client_id: "openshift-challenging-client",
        logout_uri: ""
    })
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.headers.common["Authorization"] = "Bearer n4YC--YHysyvbTrTi0qqq6cpsTuYP0rqpcynK75O2J4";

        $httpProvider.interceptors.push([
            '$injector',
            function ($injector) {
                return $injector.get('AuthInterceptor');
            }
        ]);
    }])

    .run(['$rootScope', function ($rootScope) {
        $rootScope.$on('$stateChangeStart', function () {
            $rootScope.transfering = true;
        });
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            //更新header标题
            $rootScope.console.state = toState.name;
            $rootScope.transfering = false;
        });
    }]);

    return myApp;
});
