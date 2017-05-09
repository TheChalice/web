'use strict';

angular.module('console.build.detail', [
        {
            files: [
                'views/build_detail/build_detail.css'
            ]
        }
    ])
    .controller('BuildDetailCtrl', ['repositorywebhook','buildLog','ImageStreamTag','deleteSecret', 'Ws', 'Sort', 'GLOBAL', '$rootScope', '$scope', '$log', '$state', '$stateParams', '$location', 'BuildConfig', 'Build', 'Confirm', 'UUID', 'WebhookLab', 'WebhookHub', 'WebhookLabDel', 'WebhookHubDel', 'ImageStream', 'WebhookLabget', 'WebhookGitget'
        , function (repositorywebhook,buildLog,ImageStreamTag,deleteSecret, Ws, Sort, GLOBAL, $rootScope, $scope, $log, $state, $stateParams, $location, BuildConfig, Build, Confirm, UUID, WebhookLab, WebhookHub, WebhookLabDel, WebhookHubDel, ImageStream, WebhookLabget, WebhookGitget) {
            var checklength = function (str) {
                var displayLength = 50;
                //displayLength = this.attr("displayLength") || displayLength;
                var text = str
                if (!text) return "";
                var result = "";
                var count = 0;
                for (var i = 0; i < displayLength; i++) {
                    var _char = text.charAt(i);
                    if (count >= displayLength)  break;
                    if (/[^x00-xff]/.test(_char))  count++;  //双字节字符，//[u4e00-u9fa5]中文

                    result += _char;
                    count++;
                }
                if (result.length < text.length) {
                    result += "...";
                }
                //this.text(result);
                return result;
            }
            $scope.grid = {};
            var loadBuildConfig = function () {
                BuildConfig.get({namespace: $rootScope.namespace, name: $stateParams.name,region:$rootScope.region}, function (data) {
                    $log.info('data', data);
                    //$log.info('labsecrect is',data.spec.source.sourceSecret.name);
                    $scope.data = data;
                    var host = $scope.data.spec.source.git.uri;
                    if (data.spec.source.git.uri.split(':')[0] == 'ssh') {
                        var host = data.spec.source.git.uri.replace('git@', '').replace('.git', '');

                        //console.log(host.split('/'));

                        var parser = document.createElement('a');

                        parser.href = host;

                        parser.protocol = 'http:';

                        var post = parser.host.split(':')[0];
                        parser.host = post;
                        //console.log(parser.href);
                        //console.log(parser.hostname);
                        //console.log(parser.pathname);
                        data.spec.source.git.uri = 'https://' + parser.hostname + parser.pathname
                    }
                    data.spec.source.git.newuri = checklength(data.spec.source.git.uri)
                    //var parser = document.createElement('a');
                    //
                    //parser.href = host;
                    //
                    //console.log(parser.protocol); // => "http:"
                    //console.log(parser.hostname); // => "example.com"
                    //console.log(parser.port);     // => "3000"
                    //console.log(parser.pathname); // => "/pathname/"
                    //console.log(parser.hash);     // => "#hash"
                    //console.log(parser.host);     // => "example.com:3000"
                    //$log.info("printhost%%%%", host);

                    if (data.spec && data.spec.completionDeadlineSeconds) {
                        $scope.grid.completionDeadlineMinutes = parseInt(data.spec.completionDeadlineSeconds / 60);
                    }
                    if (data.spec.triggers.length) {
                        //$scope.grid.checked = 'start';
                        //$scope.grid.checkedLocal = true;
                    }
                    checkWebStatus();

                }, function (res) {
                    //错误处理
                });
            };
            $scope.grid.webhookType = '';
            var checkWebStatus = function () {
                var host = $scope.data.spec.source.git.uri;

                if (getSourceHost(host) === 'github.com') {
                    $scope.grid.webhookType = 'github';
                    repositorywebhook.get({source: 'github',ns:$scope.namespace,bc:$stateParams.name}, function (res) {
                        console.log('webhook', res);
                        if (!res.id) {
                            $scope.grid.checked = false;
                        }else {
                            $scope.grid.checked = true;
                        }
                    })
                    //WebhookGitget.get({namespace: $rootScope.namespace, build: $stateParams.name,region: $rootScope.region}, function (res) {
                    //    //console.log('666',res);
                    //    if (res.code == 1200) {
                    //        $scope.grid.checked = true;
                    //    }
                    //
                    //}, function (res) {
                    //    //console.log('666',res);
                    //    if (res.data.code == 1404) {
                    //        $scope.grid.checked = false;
                    //    }
                    //})
                } else {
                    //console.log($scope.data);
                    //id:$scope.data.metadata.annotations.id,
                    $scope.grid.webhookType = 'gitlab';
                    repositorywebhook.get({source: 'gitlab',ns:$scope.namespace,bc:$stateParams.name}, function (res) {
                        console.log('webhook', res);
                        if (!res.id) {
                            $scope.grid.checked = false;
                        }else {
                            $scope.webhookid=res.id;
                            $scope.grid.checked = true;
                        }
                        console.log('$scope.grid.checked',$scope.grid.checked);
                    })

                }
                $scope.selection = true
            }
            var getSourceHost = function (href) {
                var l = document.createElement("a");
                l.href = href;
                return l.hostname;
            };
            loadBuildConfig();
            //获取build记录
            var loadBuildHistory = function (name) {
                //console.log('name',name)
                Build.get({namespace: $rootScope.namespace, labelSelector: 'buildconfig=' + name,region:$rootScope.region}, function (data) {
                    //console.log("history", data);
                    data.items = Sort.sort(data.items, -1); //排序
                    $scope.databuild = data;
                    console.log('$scope.databuild',$scope.databuild);
                    if ($stateParams.from == "create/new") {

                        $scope.databuild.items[0].showLog = true;
                    }
                    //console.log($scope.databuild);
                    //fillHistory(data.items);

                    //emit(imageEnable(data.items));
                    $scope.resourceVersion = data.metadata.resourceVersion;
                    watchBuilds(data.metadata.resourceVersion);
                }, function (res) {
                    //todo 错误处理
                });
            };
            loadBuildHistory($state.params.name);
            var watchBuilds = function (resourceVersion) {
                Ws.watch({
                    resourceVersion: resourceVersion,
                    namespace: $rootScope.namespace,
                    type: 'builds',
                    name: ''
                }, function (res) {
                    var data = JSON.parse(res.data);
                    updateBuilds(data);
                }, function () {
                    $log.info("webSocket start");
                }, function () {
                    $log.info("webSocket stop");
                    var key = Ws.key($rootScope.namespace, 'builds', '');
                    //console.log(key, $rootScope);
                    if (!$rootScope.watches[key] || $rootScope.watches[key].shouldClose) {
                        return;
                    }
                    watchBuilds($scope.resourceVersion);
                });
            };

            var updateBuilds = function (data) {
                //console.log('ws状态', data);
                if (data.type == 'ERROR') {
                    $log.info("err", data.object.message);
                    Ws.clear();
                    //TODO直接刷新bc会导致页面重新渲染
                    loadBuildHistory($state.params.name);
                    return;
                }

                $scope.resourceVersion = data.object.metadata.resourceVersion;

                if (data.type == 'ADDED') {
                    data.object.showLog = true;
                    $scope.databuild.items.unshift(data.object);

                } else if (data.type == "MODIFIED") {
                    // 这种方式非常不好,尽快修改
                    angular.forEach($scope.databuild.items, function (item, i) {
                        if (item.metadata.name == data.object.metadata.name) {
                            data.object.showLog = $scope.databuild.items[i].showLog;
                            if (data.object.status.phase == 'Complete') {
                                //emit(true);
                            }
                            Build.log.get({
                                namespace: $rootScope.namespace,
                                name: data.object.metadata.name,
                                region: $rootScope.region
                            }, function (res) {
                                var result = "";
                                for (var k in res) {
                                    if (/^\d+$/.test(k)) {
                                        result += res[k];
                                    }
                                }
                                data.object.buildLog = result;
                                $scope.logs=result
                                $scope.databuild.items[i] = data.object;
                                loglast()
                            }, function () {

                                $scope.databuild.items[i] = data.object;
                            });
                        }
                    });
                }
            };
            $scope.delete = function (idx) {
                var title = "删除记录";
                var msg = "确定要删除吗？";
                var tip = "";

                var name = $scope.databuild.items[idx].metadata.name;
                if (!name) {
                    return;
                }
                Confirm.open(title, msg, tip, 'recycle').then(function () {
                    Build.remove({namespace: $rootScope.namespace, name: name,region:$rootScope.region}, function () {
                        $log.info("deleted");
                        for (var i = 0; i < $scope.databuild.items.length; i++) {
                            if (name == $scope.databuild.items[i].metadata.name) {
                                $scope.databuild.items.splice(i, 1)
                            }
                        }

                        $scope.$watch('databuild', function (n, o) {
                            //console.log(n.items.length);
                            if (n.items.length == '0') {
                                $rootScope.testq = 'finsh'
                            }
                        })
                        // if (idx == '0') {
                        //   $rootScope.testq.type = 'delete';
                        //   $rootScope.testq.git = $scope.data.items[0].spec.revision.git.commit;
                        // }
                    }, function (res) {
                        //todo 错误处理
                        $log.info("err", res);
                    });
                });
            }

            $scope.isShowmodal = {
                //'fuwubushu': false,
                //'fuwujiankong': false,
                //'bushujilu': false,
                'peizhixinxi':false,
                //'xiugaipeizhi':false,
            }

            if ($(".zx_set_btn").hasClass("zx_set_btn_rotate")) {
                //console.log($(".create_new_nav"));
                $(".create_new_nav2").removeClass("create_new_nav_new")
            } else {
                $(".create_new_nav2").addClass("create_new_nav_new")
            }
            function initModal() {
                var $detailModal = $('.detail_new_modal');
                var widthnav = $(window).width();
                $detailModal.css({
                    'left':widthnav
                });
            }
            initModal();
            function initModalH() {
                var $height = $(window).height()-52;
                var $main_height=$(window).height()-100;
                var $detailModal = $('.detail_new_modal');
                var $block_h_set = $('.detail_new_modal .block_h_set');//配置信息
                $detailModal.css({
                    'height':$height,
                });
                $block_h_set.css({
                    'height':$main_height,
                });
            }

            $(window).resize(function(){
                initModalH();
            })
            /*关闭弹出层*/
            $scope.pageName = '构建详情'
            $scope.close = function () {
                $scope.pageName = '构建详情'
                document.body.onscroll = function () {
                }
                var $detailModal = $('.detail_new_modal');
                var $window_width = $(window).width();
                $detailModal.animate({
                    left: $window_width
                }, 'normal', 'linear', function () {
                    $scope.isShowmodal[$scope.whatmodal] = false;
                    $scope.whatmodal = '';
                })

            }
            /*打开弹出层*/
            $scope.whatmodal = '';
            $scope.openModal = function (name, modal) {
                $scope.pageName = name
                var top = document.documentElement.scrollTop || document.body.scrollTop;
                document.body.onscroll = function (e) {
                    //console.log('ss',top);
                    e.preventDefault();
                    //window.scrollTo(0,top);
                }
                initModalH();
                $scope.name = name;
                $scope.isShowmodal[modal] = true;
                $('.detail_new_modal').animate({
                    left: 0,
                    right:0
                }, 'normal', 'linear');
                $scope.whatmodal = modal;
            }
            //图片欲加载
            var images = new Array()
            function preload() {
                for (var i = 0; i < arguments.length; i++) {
                    images[i] = new Image()
                    images[i].src = arguments[i]
                }
            };
            preload(
                "views/service_detail_new/img/img_err.png",
                "views/service_detail_new/img/img_succ.png",
                "views/service_detail_new/img/img_warn.png",
                "views/service_detail_new/img/img_run.png"
            );

            $scope.$on("$destroy", function() {
                document.body.onscroll = function () {
                }
            });
            //function getlogs(){
            //    var o = $scope.databuild.items[idx];
            //    //o.showLog = !o.showLog;
            //
            //    if (o.status.phase == "Pending") {
            //        return;
            //    }
            //    //存储已经调取过的log
            //    if (o.buildLog) {
            //        loglast()
            //        return;
            //    }
            //    Build.log.get({namespace: $rootScope.namespace, name: o.metadata.name,region:$rootScope.region}, function (res) {
            //        var result = "";
            //        for (var k in res) {
            //            if (/^\d+$/.test(k)) {
            //                result += res[k];
            //            }
            //        }
            //        o.buildLog = result;
            //        loglast()
            //        $scope.logs=
            //            buildLog.open(result)
            //    }, function (res) {
            //        //console.log("res", res);
            //        o.buildLog = res.data.message;
            //        buildLog.open(res.data.message)
            //    });
            //}
            /////// 获取日志

            $scope.getLog = function (idx) {

                buildLog.open($scope.resourceVersion,$scope.databuild,idx)

            };

            var loglast = function () {
                setTimeout(function () {
                    $('#sa').scrollTop(1000000)
                }, 200)
            }
            //开始构建
            $scope.startBuild = function () {
                var name = $scope.data.metadata.name;
                var buildRequest = {
                    metadata: {
                        name: name
                    }
                };
                BuildConfig.instantiate.create({
                    namespace: $rootScope.namespace,
                    name: name,
                    region: $rootScope.region
                }, buildRequest, function (res) {
                    $log.info("build instantiate success", res);
                    $scope.active = 1;  //打开记录标签
                    $scope.$broadcast('timeline', 'add', res);
                    loadBuildHistory($state.params.name);
                    //createWebhook();
                    //deleteWebhook();
                }, function (res) {
                    //todo 错误处理
                });
            };
            var removeBuilds = function (bcName) {
                if (!bcName) {
                    return;
                }
                Build.remove({namespace: $rootScope.namespace, labelSelector: 'buildconfig=' + bcName}, function () {
                    $log.info("remove builds of " + bcName + " success");
                }, function (res) {
                    $log.info("remove builds of " + bcName + " error");
                });
            };

            var removeIs = function (name) {
                ImageStream.delete({
                    namespace: $rootScope.namespace,
                    name: name,
                    region: $rootScope.region
                }, {}, function (res) {
                    //console.log("yes removeIs");
                }, function (res) {
                    //console.log("err removeIs");
                })
            }
            /////删除构建
            $scope.deletes = function () {
                var name = $scope.data.metadata.name;
                Confirm.open("删除构建", "确定要删除吗？", "", 'recycle').then(function () {
                    BuildConfig.remove({namespace: $rootScope.namespace, name: name,region:$rootScope.region}, {}, function () {
                        $log.info("remove buildConfig success");
                        if ($scope.data.metadata.annotations.isother === 'true') {
                            deleteSecret.delete({
                                namespace: $rootScope.namespace,
                                name: "custom-git-builder-" + $rootScope.user.metadata.name + '-' + name,
                                region:$rootScope.region
                            }), {}, function (res) {

                            }
                        }

                        removeIs($scope.data.metadata.name);
                        removeBuilds($scope.data.metadata.name);
                        var host = $scope.data.spec.source.git.uri;
                        if (getSourceHost(host) === 'github.com') {
                            repositorywebhook.get({source: 'github',ns:$scope.namespace,bc:$scope.data.metadata.name}, function (data) {
                                console.log('1111111',data);
                                if(data.id){
                                    repositorywebhook.delete({id:data.id,source: 'github',ns:$scope.namespace,bc:$scope.data.metadata.name},{}, function (res) {
                                        $scope.grid.checked = false;
                                        console.log('lalala删github',res);
                                    })
                                }
                            })
                        } else {
                            repositorywebhook.get({source: 'gitlab',ns:$scope.namespace,bc:$scope.data.metadata.name}, function (data) {
                                if(data.id){
                                    repositorywebhook.delete({id:data.id,source: 'gitlab',ns:$scope.namespace,bc:$scope.data.metadata.name},{}, function (res) {
                                        console.log('lalala删gitlab',res);
                                        $scope.grid.checked = false;
                                    })
                                }
                            })
                        }
                        $state.go("console.build");
                    }, function (res) {
                        //todo 错误处理
                    });
                });
            };
            ///////自动构建
            var getConfig = function (triggers, type) {
                //console.log(triggers)
                var str = ''
                if (type == 'github' && triggers[0].github) {
                    str = GLOBAL.host_webhooks + '/oapi/v1/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.data.metadata.name + '/webhooks/' + triggers[0].github.secret + '/github'
                    return str;
                } else if (type == 'gitlab' && triggers[1].generic) {
                    str = GLOBAL.host_webhooks + '/oapi/v1/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.data.metadata.name + '/webhooks/' + triggers[1].generic.secret + '/generic'
                    return str;
                }


                var str = "";
                for (var k in triggers) {
                    if (triggers[k].type == 'GitHub') {
                        str = GLOBAL.host_webhooks + '/namespaces/' + $rootScope.namespace + '/buildconfigs/' + $scope.data.metadata.name + '/webhooks/' + triggers[k].github.secret + '/github'
                        return str;
                    }
                }
            };
            $scope.changeHook = function(){
                if($scope.grid.checked){
                    if($scope.grid.webhookType == 'github'){
                        repositorywebhook.get({source: 'github',ns:$scope.namespace,bc:$scope.data.metadata.name}, function (data) {
                            repositorywebhook.delete({id:data.id,source: 'github',ns:$scope.namespace,bc:$scope.data.metadata.name},{}, function (res) {
                                $scope.grid.checked = false;
                                console.log('lalala删github',res);
                            })

                        })

                    }else{
                        repositorywebhook.get({source: 'gitlab',ns:$scope.namespace,bc:$scope.data.metadata.name}, function (data) {
                            repositorywebhook.delete({id:data.id,source: 'gitlab',ns:$scope.namespace,bc:$scope.data.metadata.name},{}, function (res) {
                                console.log('lalala删gitlab',res);
                                $scope.grid.checked = false;
                            })

                        })

                    }
                    //$scope.grid.checked = false;
                }else{
                    var triggers = $scope.data.spec.triggers;
                    if($scope.grid.webhookType == 'github'){
                        var config = getConfig(triggers, 'github');
                        repositorywebhook.create({source: 'github',ns:$scope.namespace,bc:$scope.data.metadata.name},{"params":{
                            "ns":$scope.data.metadata.annotations.user,
                            "repo":$scope.data.metadata.annotations.repo,
                            url:config
                        }}, function (res) {
                            console.log('lalala创建github',res);
                            $scope.grid.checked = true;
                        })
                    }else{
                        var config = getConfig(triggers, 'gitlab');
                        console.log('lalala创建gitlab',$scope.data);
                        repositorywebhook.create({source: 'gitlab',ns:$scope.namespace,bc:$scope.data.metadata.name},{
                            "params":{
                                id:$scope.data.metadata.annotations.id,
                                url:config
                            }}, function (res) {
                            $scope.grid.checked = true;
                        })
                    }

                }
            }

        }])
    .service('buildLog', ['$uibModal', function ($uibModal) {
        this.open = function (rev,bc,idx) {
            return $uibModal.open({
                backdrop: 'static',
                templateUrl: 'views/build_detail/buildLog.html',
                size: 'default modal-lg',
                controller: ['$scope','$uibModalInstance','Ws','$rootScope','Build','$log',
                    function ($scope,$uibModalInstance,Ws,$rootScope,Build,$log) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };

                        getlogs(idx)
                        $scope.buildLog='正在获取中。。。'
                        function getlogs(idx){

                            var o = bc.items[idx];
                            //o.showLog = !o.showLog;
                            Build.log.get({namespace: $rootScope.namespace, name: o.metadata.name,region:$rootScope.region}, function (res) {
                                var result = "";
                                for (var k in res) {
                                    if (/^\d+$/.test(k)) {
                                        result += res[k];
                                    }
                                }
                                //o.buildLog = result;
                                $scope.buildLog =result

                            }, function (res) {
                                //console.log("res", res);
                                $scope.buildLog =res
                            });
                        }

                        var watchBuilds = function (resourceVersion) {
                            Ws.watch({
                                resourceVersion: resourceVersion,
                                namespace: $rootScope.namespace,
                                type: 'builds',
                                name: ''
                            }, function (res) {
                                var data = JSON.parse(res.data);
                                updateBuilds(data);
                            }, function () {
                                $log.info("webSocket start");
                            }, function () {
                                $log.info("webSocket stop");
                                var key = Ws.key($rootScope.namespace, 'builds', '');
                                //console.log(key, $rootScope);
                                if (!$rootScope.watches[key] || $rootScope.watches[key].shouldClose) {
                                    return;
                                }
                                watchBuilds($scope.resourceVersion);
                            });
                        };
                        watchBuilds(rev)
                        var updateBuilds = function (data) {
                            //console.log('ws状态', data);
                            if (data.type == 'ERROR') {
                                $log.info("err", data.object.message);
                                Ws.clear();
                                return;
                            }
                            $scope.resourceVersion = data.object.metadata.resourceVersion;

                            if (data.type == 'ADDED') {
                                data.object.showLog = true;
                                $scope.databuild.items.unshift(data.object);

                            } else if (data.type == "MODIFIED") {
                                // 这种方式非常不好,尽快修改
                                angular.forEach(bc.items, function (item, i) {
                                    if (item.metadata.name == data.object.metadata.name) {
                                        //data.object.showLog = $scope.databuild.items[i].showLog;
                                        if (data.object.status.phase == 'Complete') {
                                            //emit(true);
                                        }
                                        Build.log.get({
                                            namespace: $rootScope.namespace,
                                            name: data.object.metadata.name,
                                            region: $rootScope.region
                                        }, function (res) {
                                            var result = "";
                                            for (var k in res) {
                                                if (/^\d+$/.test(k)) {
                                                    result += res[k];
                                                }
                                            }
                                            $scope.buildLog =result
                                        }, function () {

                                        });
                                    }
                                });
                            }
                        };

                    }]
            }).result;
        };

    }])
