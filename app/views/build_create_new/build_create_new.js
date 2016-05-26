'use strict';
angular.module('console.build_create_new', [
    {
        files: [
        ]
    }
])
    .controller ('BuildcCtrl', ['$rootScope', '$scope', '$state', '$log', 'Owner', 'Org', 'Branch','labOwner','psgitlab','laborgs','labBranch','ImageStream', 'BuildConfig', 'Alert','labSc','$http',function($rootScope, $scope, $state, $log, Owner, Org, Branch,labOwner,psgitlab,laborgs,labBranch,ImageStream, BuildConfig, Alert,labSc,$http) {


        $scope.buildConfig = {
            metadata: {
                name: ''
            },
            spec: {
                triggers: [],
                source: {
                    type: 'Git',
                    git: {
                        uri: '',
                        ref: ''
                    },
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
        $scope.completionDeadlineMinutes = 30;
        var thisindex = 0;

        $scope.create = function() {
            getlabsecret($scope.labHost,$scope.labobjs[$scope.grid.labproject].id);
            $scope.creating = true;
            var imageStream = {
                metadata: {
                    name: $scope.buildConfig.metadata.name
                }
            };
            ImageStream.create({namespace: $rootScope.namespace}, imageStream, function (res) {
                $log.info("imageStream", res);
                createBuildConfig(res.metadata.name);
            }, function(res){
                $log.info("err", res);
                if (res.data.code == 409) {
                    createBuildConfig($scope.buildConfig.metadata.name);
                } else {
                    Alert.open('错误', res.data.message, true);
                    $scope.creating = false;
                }
            });

            var createBuildConfig = function() {
                console.log('$scope.grid.ishide-=-=',$scope.grid.ishide);
                console.log('$scope.grid.labcon-=-=',$scope.grid.labcon);
                if($scope.grid.ishide == false){
                    $scope.buildConfig.spec.completionDeadlineSeconds = $scope.completionDeadlineMinutes * 60;
                    $scope.buildConfig.spec.source.git.ref = $scope.branch[$scope.grid.branch].commit.sha;
                    $scope.buildConfig.spec.source.sourceSecret.name = $scope.owner.secret;
                    $scope.buildConfig.spec.source.git.uri = $scope.usernames[$scope.grid.user].repos[$scope.grid.project].clone_url;
                    $scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name + ":" + $scope.branch[$scope.grid.branch].name;
                }else if($scope.grid.labcon == true){
                    $scope.buildConfig.spec.completionDeadlineSeconds = $scope.completionDeadlineMinutes * 60;
                    $scope.buildConfig.spec.source.git.ref = $scope.labBranchData[$scope.grid.labbranch].commit.id;
                    $scope.buildConfig.spec.source.sourceSecret.name = $scope.grid.labsecret;
                    $scope.buildConfig.spec.source.git.uri = $scope.usernames[$scope.grid.user].repos[$scope.grid.labproject].ssh_url_to_repo;
                    $scope.buildConfig.spec.output.to.name = $scope.buildConfig.metadata.name + ":" + $scope.labBranchData[$scope.grid.labbranch].name;
                }

                BuildConfig.create({namespace: $rootScope.namespace},$scope.buildConfig, function(res){
                    $log.info("buildConfig",res);
                    createBuild(res.metadata.name);
                    $scope.creating = false;
                }, function(res){
                    $scope.creating = false;
                    if (res.data.code == 409) {
                        Alert.open('错误', "构建名称重复", true);
                    } else {
                        Alert.open('错误', res.data.message, true);
                    }
                });

            };
            createBuildConfig();
        };

        var createBuild = function(name) {
            var buildRequest = {
                metadata: {
                    name: name
                }
            };
            BuildConfig.instantiate.create({namespace: $rootScope.namespace, name: name}, buildRequest, function(){
                $log.info("build instantiate success");
                $state.go('console.build_detail', {name: name, from: 'create'})
            }, function(res){
                //todo 错误处理
            });
        };

        $scope.usernames = [];
        $scope.refresh = function() {
            $scope.grid.ishide= false;
            Owner.query({namespace: $rootScope.namespace},function(res) {
                $log.info("owner", res);
                $scope.owner = res.msg;
                for(var i = 0 ; i < res.msg.infos.length;i++){
                    $scope.usernames.push(res.msg.infos[i]);
                    for(var j = 0; j < res.msg.infos[i].repos.length;j++){
                        res.msg.infos[i].repos[j].loginname = res.msg.infos[i].login;
                    }
                }
                $log.info("userProject", $scope.login);
            },function(data){
                $log.info('-=-=-=-=',data);
                if (data.status == 401) {
                    if (data.data.code == 1401){
                        //goto github
                    }
                }
            });
            $scope.usernames.length = 0;
            console.log($scope.usernames);

            Org.get(function(data) {
                $log.info("org", data);
                for(var i = 0 ; i < data.msg.length;i++){
                    $scope.usernames.push(data.msg[i]);
                    for(var j = 0; j < data.msg[i].repos.length;j++){
                        data.msg[i].repos[j].loginname = data.msg[i].login;
                    }
                }
            });
        }
        var getlabsecret = function(ht,pjId){
            var objJson = {
                "host" : ht,
                "project_id" : pjId
            }
            $http.post('/v1/repos/gitlab/authorize/deploy',objJson, {headers: {'namespace': $rootScope.namespace}}).success(function(data) {
                console.log("iwurweioriewroewuroiweu",data);
                $scope.grid.labsecret = data.secret;

            })
        }
        $scope.selectUser = function(idx) {
            $scope.grid.user = idx;
            $scope.reposobj = $scope.usernames[idx].repos;
            thisindex = idx;
            $log.info('$scope.projectList.reposobj',$scope.reposobj);
        }
        $scope.selectProject = function(idx) {
            $scope.grid.project = idx;
            var selectUsername = $scope.usernames[thisindex].login;
            var selectRepo = $scope.usernames[thisindex].repos[idx].name;
            $log.info("user and repos",selectUsername + selectRepo);
            Branch.get({users:selectUsername, repos:selectRepo},function(info) {
                $log.info("branch", info);
                $scope.branch = info.msg;
            });
        };
        $scope.selectBranch = function(idx) {
            $scope.grid.branch = idx;
        };
        $scope.psgitlab = {
            host : "",
            user : "",
            private_token : ""
        }
        $scope.labusername = [];
        $scope.labrepos = [];
        $scope.grid = {
            users: null,
            project: null,
            branch: null,
            labusers: null,
            labproject: null,
            labbranch: null,
            gitlabbox : false,
            ishide : true,
            labcon : false,
            labsecret : ""
        };
        var thisowner = {};
        $scope.test111 = function(){
            $scope.grid.ishide = true;
            $scope.grid.labcon = false;
        }
        $scope.loadlabOwner = function(){
            $scope.grid.labcon = true;
            labOwner.get({},function(data) {
                $log.info("labOwner", data)
                for(var i = 0 ; i < data.msg.infos.length;i++){
                    //$scope.labusername.push(data.msg[i]);
                    thisowner = data.msg.infos[0];
                    for(var j = 0; j < data.msg.infos[i].repos.length;j++){
                        data.msg.infos[i].repos[j].objsname = data.msg.infos[i].owner.name;
                    }
                }
                loadlaborgs();
                $log.info(' $scope.grid0-0-0', $scope.grid)
            },function(data){
                $log.info("labOwner-------err",data);
                if(data.status == 400 && data.data.code == 1400){
                    $scope.grid.labcon = false;
                    $scope.grid.gitlabbox = true;
                }
            });
        }

        var loadlaborgs = function(){
            laborgs.get({},function(data) {
                $scope.labHost = data.msg.host;
                $scope.labusername = [];
                $scope.labusername[0] = thisowner;
                $log.info("laborgs", data)
                for(var i = 0 ; i < data.msg.infos.length;i++){
                    $scope.labusername.push(data.msg.infos[i]);
                    for(var j = 0; j < data.msg.infos[i].repos.length;j++){
                        data.msg.infos[i].repos[j].objsname = data.msg.infos[i].org.name;
                    }
                }
                $log.info("0-0-0-00-0-$scope.labusername",$scope.labusername);
            },function(data){
                $log.info("laborgs-------err",data)
            });
        }
        $scope.loadLabBranch = function(idx){
            var labId = $scope.labobjs[idx].id;
            labBranch.get({repo:labId},function(data){
                $scope.labBranchData = data;
                $scope.grid.labproject = idx;
                $log.info("loadLabBranch--=-=",data)
            },function(data){
                $log.info("loadLabBranch--=-=err",data)
            })
        }
        $scope.selectlabUser = function(idx) {
            $scope.labobjs = $scope.labusername[idx].repos;
            $scope.grid.labuser = idx;
            //$log.info('-0-0-0$scope.labobjs',$scope.labobjs);
        }
        $scope.selectlabBranch = function(idx){
            $scope.grid.labbranch = idx;
        }
        $scope.creatgitlab = function(){
            psgitlab.create({},$scope.psgitlab,function(res){
                $log.info('psgitlab-----0000',res);
                $scope.loadlabOwner();
                $scope.grid.labcon = true;
                $scope.grid.gitlabbox = false;
            },function(res){
                $log.info('psgitlab-----err',res);

            })
        }


    }])

