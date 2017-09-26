'use strict';
angular.module('console.build_create_new', [
        {
            files: []
        }
    ])
    .controller('BuildcCtrl', ['createdeploy','randomWord', '$rootScope', '$scope', '$state', '$log', 'Owner', 'Org', 'Branch', 'labOwner', 'psgitlab', 'laborgs', 'labBranch', 'ImageStream', 'BuildConfig', 'Alert', '$http', 'Cookie', '$base64', 'secretskey',
        function (createdeploy,randomWord, $rootScope, $scope, $state, $log, Owner, Org, Branch, labOwner, psgitlab, laborgs, labBranch, ImageStream, BuildConfig, Alert, $http, Cookie, $base64, secretskey) {
            $('input[ng-model="buildConfig.metadata.name"]').focus();
            $scope.check=1
            $scope.labrunning = false;
            $scope.runninghub = false;
            $scope.buildConfig = {
                metadata: {
                    name: "",
                    annotations: {
                        'datafoundry.io/create-by': $rootScope.user.metadata.name,
                        repo: ''
                    },
                },
                spec: {
                    triggers: [
                        {
                            type: "GitHub",
                            github: {
                                secret: randomWord.word(false, 25)
                            }
                        }, {
                            type: "Generic",
                            generic: {
                                secret: randomWord.word(false, 20)
                            }
                        }
                    ],
                    source: {
                        type: 'Git',
                        git: {
                            uri: '',
                            ref: ''
                        },
                        contextDir: '/',
                        sourceSecret: {
                            name: ''
                        }
                    },
                    strategy: {
                        type: 'Docker'
                    },
                    output: {
                        to: {
                            kind: 'ImageStreamTag',
                            name: ''
                        }
                    },
                    completionDeadlineSeconds: 1800
                }
            };

            // 构建名称验证
            $scope.namerr = {
                nil: false,
                rexed: false,
                repeated: false
            }
            $scope.nameblur = function () {
                if (!$scope.buildConfig.metadata.name) {
                    $scope.namerr.nil = true
                } else {
                    $scope.namerr.nil = false
                }
            }


        }]);

