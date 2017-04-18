'use strict';

angular.module('console.build.detail', [
        {
            files: [
                'views/build_detail_new/build_detail.css'
            ]
        }
    ])
    .controller('BuildDetailCtrl', ['ImageStreamTag','deleteSecret', 'Ws', 'Sort', 'GLOBAL', '$rootScope', '$scope', '$log', '$state', '$stateParams', '$location', 'BuildConfig', 'Build', 'Confirm', 'UUID', 'WebhookLab', 'WebhookHub', 'WebhookLabDel', 'WebhookHubDel', 'ImageStream', 'WebhookLabget', 'WebhookGitget'
        , function (ImageStreamTag,deleteSecret, Ws, Sort, GLOBAL, $rootScope, $scope, $log, $state, $stateParams, $location, BuildConfig, Build, Confirm, UUID, WebhookLab, WebhookHub, WebhookLabDel, WebhookHubDel, ImageStream, WebhookLabget, WebhookGitget) {


        }]);

