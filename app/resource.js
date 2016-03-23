'use strict';

define([
    'angular',
    'ngResource'
], function (angular) {

    var HOST = 'https://54.222.199.235:8443/oapi/v1';
    //var HOST = 'https://192.168.99.100:8443/oapi/v1';
    var HOST_WSS = 'wss://54.222.199.235:8443/oapi/v1';
    var HOST_GIT = 'https://api.github.com';
    var NAMESPACE = 'foundry';

    return angular.module('myApp.resource', ['ngResource'])
        .factory('User', ['$resource', function($resource){
            var User = $resource(HOST + '/users/:name', {name: '@name'}, {
                create: { method: 'POST'}
            });
            return User;
        }])
        .factory('Build', ['$resource', '$ws', '$log', function($resource, $ws, $log){
            //GET /oapi/v1/namespaces/{namespace}/builds
            var Build = $resource(HOST + '/namespaces/' + NAMESPACE + '/builds/:name', {name: '@name'}, {
                create: { method: 'POST'}
            });
            Build.log = $resource(HOST + '/namespaces/' + NAMESPACE + '/builds/:name/log', {name: '@name'}, {
                get: {method: 'GET', responseType: 'text'}
            });
            Build.watch = function(onmessage, onopen, onclose){
                if (!$ws.available()) {
                    return;
                }
                $ws({
                    method: "WATCH",
                    url: HOST_WSS + '/namespaces/' + NAMESPACE + '/builds?watch=true&resourceVersion=1922&access_token=BF-Cg8BFC58vdwXGREdPEWWWJUU85A16u43_PzZ2LPI',
                    onclose:   onclose,
                    onmessage: onmessage,
                    onopen:    onopen
                }).then(function(ws) {
                    $log.info("finish ws=", ws);
                });
            };
            return Build;
        }])
        .factory('BuildConfig', ['$resource', function($resource){
            var BuildConfig = $resource(HOST + '/namespaces/' + NAMESPACE + '/buildconfigs/:name', {name: '@name'}, {
                create: { method: 'POST'},
                put: { method: 'PUT'}
            });
            BuildConfig.instantiate = $resource(HOST + '/namespaces/' + NAMESPACE + '/buildconfigs/:name/instantiate', {name: '@name'}, {
                create: { method: 'POST'}
            });
            return BuildConfig;
        }])
        //.factory('ImageStream', ['$resource', function($resource){
        //    var ImageStream = $resource(HOST + '/namespaces/'+ NAMESPACE + '/imagestreams/:name',{name: '@name'},{
        //        create: {method: 'POST'}
        //    });
        //    return ImageStream;
        //}]);
        .factory('ImageStreamTag', ['$resource', function($resource){
            var ImageStreamTag= $resource(HOST + '/namespaces/'+ NAMESPACE  + '/imagestreamtags/:name', {name: '@name'},{
                create: {method: 'POST'}
            });
            return ImageStreamTag;
        }])
        .factory('Git', ['$resource', function($resource){
            var Git = {};
            Git.readme = $resource(HOST_GIT + '/repos/:owner/:repo/readme', {owner: '@owner', repo: '@repo'});
            return Git;
        }]);
});
