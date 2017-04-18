'use strict';
angular.module('console.build_create', [
        {
            files: [
                'views/build_create/build_create.css'
            ]
        }
    ])
    .controller('BuildCreateCtrl', ['repositorybranches','repository','authorize','randomWord', '$rootScope', '$scope', '$state', '$log', 'Owner', 'Org', 'Branch', 'labOwner', 'psgitlab', 'laborgs', 'labBranch', 'ImageStream', 'BuildConfig', 'Alert', '$http', 'Cookie', '$base64', 'secretskey',
        function (repositorybranches,repository,authorize,randomWord, $rootScope, $scope, $state, $log, Owner, Org, Branch, labOwner, psgitlab, laborgs, labBranch, ImageStream, BuildConfig, Alert, $http, Cookie, $base64, secretskey) {


        }]);

