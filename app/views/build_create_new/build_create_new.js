'use strict';
angular.module('console.build_create_new', [
        {
            files: [
                'views/build_create_new/build_create_new.css'
            ]
        }
    ])
    .controller('BuildcCtrl', ['GLOBAL','repositorywebhook','repositorysecret', 'repositorybranches', 'repository', 'authorize', 'randomWord', '$rootScope', '$scope', '$state', '$log', 'Owner', 'Org', 'Branch', 'labOwner', 'psgitlab', 'laborgs', 'labBranch', 'ImageStream', 'BuildConfig', 'Alert', '$http', 'Cookie', '$base64', 'secretskey',
        function (GLOBAL,repositorywebhook,repositorysecret, repositorybranches, repository, authorize, randomWord, $rootScope, $scope, $state, $log, Owner, Org, Branch, labOwner, psgitlab, laborgs, labBranch, ImageStream, BuildConfig, Alert, $http, Cookie, $base64, secretskey) {
            if ($(".zx_set_btn").hasClass("zx_set_btn_rotate")) {
                $(".create_new_nav").addClass("create_new_nav_new")
            } else {
                $(".create_new_nav").removeClass("create_new_nav_new")
            }

            function initModal() {
                var widthnav = $('.create_new_nav').width();
                $('.code_new_modal').css('left', widthnav);
                var height = $(document).height();
                var height_child = $(window).height();
                var midheight = height_child-100;
                $('.code_new_modal').css('height', height);
                $(".code_new_modal .content").height(midheight);//申请后端服务弹出内容超出-滚动条设置

            }

            initModal();
            function initModaltwo() {

                var height_child = $(window).height();
                var midheight = height_child - 100;
                var width = $(document).width() - 168;
                $('.code_new_modal > div:not(:first-child)').css({
                    'height': height_child,
                    'width': width
                });
            }

            initModaltwo();
            $(window).resize(function () {
                initModaltwo();
            })
            $scope.isShowmodal = {
                'gitlab': false,
                'github': false

            }
            /*关闭弹出��?*/
            $scope.close = function (model) {
                document.body.onscroll = function () {
                    //console.log('ss',top);
                    //window.scrollTo(0,top);
                }
                var width = $('.code_new_modal').width()
                $('.code_new_modal').animate({
                    left: (width) + "px"
                }, 'normal', 'linear', function () {
                    $scope.isShowmodal[$scope.whatmodal] = false;
                    $scope.whatmodal = '';
                })

            }

            $scope.whatmodal = '';
            $scope.openModal = function (name, modal) {
                var top = document.documentElement.scrollTop || document.body.scrollTop;
                document.body.onscroll = function () {
                    window.scrollTo(0, top);
                }
                $scope.name = name;
                $scope.isShowmodal[modal] = true;
                $('.code_new_modal').animate({
                    left: 0
                }, 'normal', 'linear');
                $scope.whatmodal = modal;
            }

            $scope.slider = {
                value: 30,
                options: {
                    floor: 0,
                    ceil: 60,
                    step: 1,
                    showSelectionBar: true,
                    showTicksValues: 30,
                    translate: function (value, sliderId, label) {
                        switch (label) {
                            default:
                                return value + '分钟'
                        }
                    }
                }
            };
            $scope.openAuto = false;
            $scope.openAutoCreate = function () {
                $scope.openAuto = !$scope.openAuto;
            }
            $scope.isComplete = false;
            $scope.isCreate = true;
            //业务逻辑

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
                        //sourceSecret: {
                        //    name: ''
                        //}
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

            var dcnamer = /^[a-z]([a-z0-9-]{0,22})?[a-z0-9]$/;
            $scope.$watch('checkgithubimage', function (n,o) {
                if (n === o) {
                    return
                }
                if (n) {
                    $scope.githubimagesearch='';
                }
            })
            $scope.$watch('checkgitlabimage', function (n,o) {
                if (n === o) {
                    return
                }
                if (n) {
                    $scope.gitlabimagesearch='';
                }
            })
            $scope.$watch('githubimagesearch', function (n,o) {
                //var imagearr = [];
                if (n === o) {
                    return
                }
                $scope.images=[]
                if (n !== '') {
                    var imagesearch = n.replace(/\//g, '\\/');
                    var reg = eval('/' + imagesearch + '/');

                    angular.forEach($scope.githubcopy[$scope.checkgithubimage-1].repos, function (image,i) {
                            //console.log('image', image);
                            if (reg.test(image.name)) {
                                $scope.images.push(image)
                            }
                        })
                    console.log(n);
                    $scope.gitdata.github[$scope.checkgithubimage-1].repos=angular.copy($scope.images)
                }else {
                    $scope.gitdata.github[$scope.checkgithubimage-1].repos=angular.copy($scope.githubcopy[$scope.checkgithubimage-1].repos)
                }


            })
            $scope.$watch('gitlabimagesearch', function (n,o) {
                //var imagearr = [];
                if (n === o) {
                    return
                }
                $scope.images=[]
                if (n !== '') {
                    var imagesearch = n.replace(/\//g, '\\/');
                    var reg = eval('/' + imagesearch + '/');
                    console.log($scope.gitlabcopy,$scope.checkgitlabimage);
                    angular.forEach($scope.gitlabcopy[$scope.checkgitlabimage-1].repos, function (image,i) {
                            //console.log('image', image);
                            if (reg.test(image.name)) {
                                $scope.images.push(image)
                            }
                        })
                    console.log(n);
                    $scope.gitdata.gitlab[$scope.checkgitlabimage-1].repos=angular.copy($scope.images)
                }else {
                    $scope.gitdata.gitlab[$scope.checkgitlabimage-1].repos=angular.copy($scope.gitlabcopy[$scope.checkgitlabimage-1].repos)
                }


            })
            $scope.namerr= {
                null:true,
                rexed:false,
                repeated:false,
                bigcode:false
            }
            BuildConfig.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
                $log.info('buildConfigs', data.items);
                $scope.buildConfiglist = data.items

            }, function (res) {
                //todo 错误处理
            });
            $scope.$watch('buildConfig.metadata.name', function (n,o) {
                if (n === o) {
                    return
                }
                $scope.namerr.null=false
                $scope.namerr.rexed = false;
                $scope.namerr.repeated = false;
                $scope.namerr.bigcode = false;
                    // console.log($scope.buildConfig.metadata.name);
                var str = n;
                if (/[A-Z]/.test(str.charAt(0))) {
                    //alert(11)
                    $scope.namerr.bigcode = true;
                }else {
                    if (dcnamer.test(n)) {
                        angular.forEach($scope.buildConfiglist, function (build,k) {
                            //angular.forEach($scope.serviceNameArr, function (build, i) {
                            if (build.metadata.name === n) {
                                $scope.namerr.repeated = true;
                            }
                        })
                        //})
                    } else {
                        $scope.namerr.rexed = true;
                    }
                }

            })
            //$scope.$watch('slider.value', function (n,o) {
            //    if (n === o) {
            //        return
            //    }
            //    if (n === 0) {
            //        $scope.slider.value=1
            //        //$scope.$apply()
            //    }
            //})
            $scope.state = {
                github: {link: false, checked: false, pedding: false},
                gitlab: {link: false, checked: false, pedding: false}
            }

            $scope.gitdata = {
                github: false,
                gitlab: false
            }

            repository.query({source: 'github'}, function (res) {
                $scope.gitdata.github = res;
                $scope.githubcopy = angular.copy(res);
                //console.log('$scope.github', $scope.github);
                $scope.state.github.link = 'link'

            }, function (err) {
                $scope.state.github.link = 'unlink'
            })
            repository.query({source: 'gitlab'}, function (res) {
                $scope.gitdata.gitlab = res;
                $scope.gitlabcopy = angular.copy(res)
                $scope.state.gitlab.link = 'link';
            }, function (err) {
                $scope.state.gitlab.link = 'unlink';
            })

            $scope.linkgit = function (git) {
                if (git === 'github') {
                    $scope.state.github.pedding = true;
                } else {
                    $scope.state.gitlab.pedding = true;
                }
                authorize.get({source: git, redirect_url: encodeURIComponent(window.location.href)}, function (res) {
                }, function (err) {
                    console.log('err', err);
                    if (err.data.code == 14003) {
                        window.location = err.data.message
                    }
                })
            }
            $scope.gettag = function (repo,git) {

                if (git === 'gitlab') {
                    repositorybranches.query({source: git,id:repo.id, repo: repo.name, ns: repo.namespace}, function (branchres) {
                        //console.log('branchres', branchres);
                        repo.tags = branchres
                    })
                }else {
                    repositorybranches.query({source: git, repo: repo.name, ns: repo.namespace}, function (branchres) {
                        //console.log('branchres', branchres);
                        repo.tags = branchres
                    })
                }


            }
            var getConfig = function (triggers, type) {
                //console.log(triggers)
                var str = ''
                if (type == 'github' && triggers[0].github) {
                    str = GLOBAL.host_webhooks + '/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.buildConfig.metadata.name + '/webhooks/' + triggers[0].github.secret + '/github'
                    return str;
                } else if (type == 'gitlab' && triggers[1].generic) {
                    str = GLOBAL.host_webhooks + '/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.buildConfig.metadata.name + '/webhooks/' + triggers[1].generic.secret + '/generic'
                    return str;
                }


                var str = "";
                for (var k in triggers) {
                    if (triggers[k].type == 'GitHub') {
                        str = GLOBAL.host_webhooks + '/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.buildConfig.metadata.name + '/webhooks/' + triggers[k].github.secret + '/github'
                        return str;
                    }
                }
            };
            function creatwebhook(git,bcres){
                var triggers = bcres.spec.triggers;
                if (git === 'github') {
                    var config = getConfig(triggers, 'github');
                    repositorywebhook.create({source: 'github',ns:$scope.namespace,bc:bcres.metadata.name},{"params":{
                        "ns":bcres.metadata.annotations.user,
                        "repo":bcres.metadata.annotations.repo,
                        "url":config
                    }}, function (res) {
                        $scope.creatpedding='down'
                        $state.go('console.build_detail', {name: $scope.buildConfig.metadata.name, from: 'create/new'})
                    })
                }else if (git === 'gitlab'){
                    var config = getConfig(triggers, 'gitlab');
                    repositorywebhook.create({source: git,ns:$scope.namespace,bc:bcres.metadata.name},{
                        "params":{
                        "id":bcres.metadata.annotations.id,
                        "url":config
                    }}, function (res) {
                        $scope.creatpedding='down'
                        $state.go('console.build_detail', {name: $scope.buildConfig.metadata.name, from: 'create/new'})
                    })
                }

            }
            $scope.creatpedding='creat'
            function creatbuildchinfg(git){
                var buildRequest = {
                    metadata: {
                        annotations: {
                            'datafoundry.io/create-by': $rootScope.user.metadata.name
                        },
                        name: $scope.buildConfig.metadata.name
                    }
                };
                BuildConfig.create({
                    namespace: $rootScope.namespace,
                    region: $rootScope.region
                }, $scope.buildConfig, function (bcres) {
                    BuildConfig.instantiate.create({
                        namespace: $rootScope.namespace,
                        name: $scope.buildConfig.metadata.name,
                        region: $rootScope.region
                    }, buildRequest, function (res) {
                        if (git !== 'other') {
                            if ($scope.openAuto) {
                                $log.info("$scope.openAuto", git);
                                creatwebhook(git,bcres);
                            }else {
                                $state.go('console.build_detail', {name: $scope.buildConfig.metadata.name, from: 'create/new'})
                            }
                        }else {
                            $scope.creatpedding='down'
                            $state.go('console.build_detail', {name: $scope.buildConfig.metadata.name, from: 'create/new'})
                        }
                    }, function (res) {
                        //console.log("uildConfig.instantiate.create",res);
                        //todo 错误处理
                    });

                }, function (res) {

                });
            }
            function createbc(git,serect) {
                //console.log('need');
                if (git === 'other') {
                    var baseun = $base64.encode($scope.gitUsername);
                    var basepwd = $base64.encode($scope.gitPwd);
                    $scope.secret = {
                        "kind": "Secret",
                        "apiVersion": "v1",
                        "metadata": {
                            "name": "custom-git-builder-" + $rootScope.user.metadata.name + '-' + $scope.buildConfig.metadata.name
                        },
                        "data": {
                            username: baseun,
                            password: basepwd
                        },
                        "type": "Opaque"
                    }
                    secretskey.create({
                        namespace: $rootScope.namespace,
                        region: $rootScope.region
                    }, $scope.secret, function (item) {
                        $scope.buildConfig.spec.source.sourceSecret={
                            name:$scope.secret.metadata.name
                        }
                        creatbuildchinfg(git);
                    })

                }else {
                    if (serect === 'need') {


                        repositorysecret.get({source: git, ns: $rootScope.namespace}, function (resecret) {
                            $scope.buildConfig.spec.source.sourceSecret={
                                name:resecret.secret
                            }
                            //$scope.buildConfig.spec.source.sourceSecret.name =;
                            creatbuildchinfg(git);
                        })
                    }else {
                        creatbuildchinfg(git);
                    }
                }
                $scope.isComplete = true;



            }

            $scope.checkboxbuild = function (repo, git) {
                $scope.buildConfig.needsrecte = repo.private
                $scope.buildConfig.spec.source.git.ref = repo.checkbox;
                //$scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name + ":" + repo.checkbox;
                $scope.buildConfig.metadata.annotations.repo = repo.name;
                $scope.buildConfig.metadata.annotations.user = repo.namespace;

                $scope.checkedrepo = repo;
                if (git === 'github') {
                    $scope.buildConfig.spec.source.git.uri = repo.clone_url;
                    $scope.state.github.checked = true

                }else {
                    $scope.buildConfig.spec.source.git.uri = repo.ssh_clone_url;
                    $scope.buildConfig.metadata.annotations.id = repo.id.toString();
                    $scope.state.gitlab.checked = true
                }
                $scope.close()
            }

            $scope.creat = function (num) {
                $scope.isCreate = false;
                var git = null;
                if ($scope.buildConfig.spec.source.git.ref) {
                    $scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name + ":" + $scope.buildConfig.spec.source.git.ref;
                }else {
                    $scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name +':latest';
                }
                //console.log('$scope.openAuto', $scope.openAuto);
                if (num === 1) {
                    git='github';
                }else if(num===2){
                    git='gitlab';
                }else {
                    git='other'
                    $scope.buildConfig.needsrecte=true
                    $scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name + ':latest';
                    $scope.buildConfig.spec.triggers = [];
                }
                if ($scope.slider.value === 0) {
                    $scope.slider.value=1
                }
                $scope.buildConfig.spec.completionDeadlineSeconds = $scope.slider.value * 60;
                var imageStream = {
                    metadata: {
                        annotations: {
                            'datafoundry.io/create-by': $rootScope.user.metadata.name,
                        },
                        name: $scope.buildConfig.metadata.name
                    }
                };
                $scope.creatpedding='pedding'
                ImageStream.create({
                    namespace: $rootScope.namespace,
                    region: $rootScope.region
                }, imageStream, function (res) {
                    $log.info("imageStream", res);
                    if ($scope.buildConfig.needsrecte) {
                        createbc(git,'need')
                    }else {
                        createbc(git)
                    }
                }, function (res) {
                    $scope.isCreate = false;

                });
            }
        }]);
