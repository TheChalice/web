'use strict';
angular.module('console.service.createnew', [
        {
            files: [

                'views/service_create_new/service_create_new.css'
            ]
        }
    ])
    .controller('ServiceCreatenewCtrl', ['$scope', '$rootScope', 'persistent', 'configmaps','secretskey','$http','BackingService','$log','volumeConfig', 'market', 'checkout', 'Tip', '$state', 'Service', 'Route', 'BackingServiceInstance','DeploymentConfig','ImageStream','ImageStreamTag','listSecret','modifySecret','Metrics','$stateParams',
        function ($scope, $rootScope, persistent, configmaps,secretskey,$http,BackingService,$log,volumeConfig, market, checkout, Tip, $state, Service, Route, BackingServiceInstance,DeploymentConfig,ImageStream,ImageStreamTag,listSecret,modifySecret,Metrics,$stateParams) {
            $scope.updata=false;
            if ($stateParams.dc) {
                console.log('$stateParams.dc', $stateParams.dc);
                $scope.updata=true
            }

            $scope.slider = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 200,
                    step: 10,
                    showSelectionBar: true,
                    showTicksValues: 50,
                    translate: function (value, sliderId, label) {
                        switch (label) {

                            default:
                                return value + 'GB'
                        }
                    }
                }
            };
            $scope.error={
                dcnameerr:{
                    rexed:false,
                    repeated:false,
                    null:true

                }
            }
            $scope.stepup={
                twoerr:false,
                hasimage:false
            }

            //
            //$http.get('/registry/api/repositories', {timeout: end.promise, params: {project_id: 1}})
            //    .success(function (docdata) {
            //        angular.forEach(docdata, function (docitem, i) {
            //            $scope.imagecenterDoc.push({
            //                name: docitem,
            //                lasttag: null,
            //                canbuild: true,
            //                class: 'doc'
            //            });
            //        })
            //        $http.get('/registry/api/repositories', {
            //                params: {project_id: 58}
            //            })
            //            .success(function (dfdata) {
            //                angular.forEach(dfdata, function (dfitem, k) {
            //                    $scope.imagecenterDF.push({
            //                        name: dfitem,
            //                        lasttag: null,
            //                        canbuild: true,
            //                        class: 'df'
            //                    });
            //                });
            //                $scope.imagecenterpoj = $scope.imagecenterDoc.concat($scope.imagecenterDF);
            //                //console.log('imagecenterpoj', $scope.imagecenterpoj);
            //                $scope.imagecentercopy = angular.copy($scope.imagecenterpoj);
            //                $scope.grid.imagecentertotal = $scope.imagecentercopy.length
            //
            //
            //            })
            //    }).error(function (err) {

            //})
            //dcname
            var dcnamer = /^[a-z]([a-z0-9_]{0,22})?[a-z0-9]$/;
            if (!$scope.updata) {
                $scope.$watch('dc.metadata.name', function (n,o) {
                    //console.log(n, $scope.frm.dcname.$error);
                    if (n && n.length > 0) {
                        $scope.error.dcnameerr.null=false
                        // console.log($scope.buildConfig.metadata.name);
                        if (dcnamer.test(n)) {
                            $scope.error.dcnameerr.rexed = false;
                            $scope.error.dcnameerr.repeated = false;
                            if ($scope.serviceNameArr) {
                                //console.log($scope.serviceNameArr);
                                angular.forEach($scope.serviceNameArr, function (build, i) {
                                    if (build === n) {
                                        $scope.error.dcnameerr.repeated = true;
                                    }
                                })
                            }
                        } else {
                            $scope.error.dcnameerr.rexed = true;
                        }
                    } else {
                        $scope.error.dcnameerr.null=true
                        $scope.error.dcnameerr.rexed = false;
                    }
                    //console.log($scope.frm.dcname.$dirty,$scope.error.dcnameerr);
                })
                //conname

            }
            $scope.$watch('dc.spec.template.spec.containers', function (n,o) {
                if (n) {
                    $scope.stepup.twoerr=true;
                    $scope.stepup.hasimage=true;
                    $scope.stepup.two=false;
                    angular.forEach(n, function (con,i) {

                        if (con.name && con.name.length > 0) {
                            con.namerr.null=false
                            // console.log($scope.buildConfig.metadata.name);
                            if (dcnamer.test(con.name)) {
                                con.namerr.rexed = false;
                                con.namerr.repeated = false;
                                angular.forEach(n, function (incon,k) {
                                    //angular.forEach($scope.serviceNameArr, function (build, i) {
                                    if (i !== k) {
                                        if (incon.name === con.name) {
                                            con.namerr.repeated = true;
                                        }
                                    }

                                })
                                //})

                            } else {
                                con.namerr.rexed = true;
                            }
                        } else {
                            con.namerr.null=true
                            con.namerr.rexed = false;
                        }
                        if (con.image === "") {
                            $scope.stepup.hasimage=false;
                        }
                        if (con.namerr.rexed || con.namerr.null || con.namerr.repeated) {
                            $scope.stepup.twoerr=false;
                        }
                    })
                    if ($scope.stepup.twoerr && $scope.stepup.hasimage) {
                        $scope.stepup.two=true;
                    }
                }


            },true)
            //数组去重
            Array.prototype.unique = function () {
                this.sort(); //先排序
                var res = [this[0]];
                for (var i = 1; i < this.length; i++) {
                    if (this[i] !== res[res.length - 1]) {
                        res.push(this[i]);
                    }
                }
                return res;
            }
            //输入框判断
            DeploymentConfig.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (data) {
                $scope.serviceNameArr=[];
                for (var i = 0; i < data.items.length; i++) {
                    $scope.serviceNameArr.push(data.items[i].metadata.name);
                }
                $scope.serviceNameArr.sort();
                //$scope.grid.namerepeat = true;
                //console.log('serviceNameArr',$scope.serviceNameArr);

            }, function (res) {
                $log.info('loadDcList', res);
                //todo ������
            });

            $('.input_text').on('keyup', function () {
                var txt = $(this).val();
                if (txt != '') {
                    $('.input_close').show();
                } else {
                    $('.input_close').hide();
                }
            });
            $('.input_close').on("click", function () {
                $(this).hide();
                $('.input_text').val('');
            });

            $('.input_text').focus(function () {
                $('.input_close').hide();
            });
            //高级设置
            //$(".adv_tit").on("click",function(){
            //    $(this).hide();
            //    $(".adv_set_detail").addClass("show");
            //});
            //收起
            $(".one_pack").on("click", function () {
                $(".block_one").hide();
                $(".block_two").show();
            })
            //展开
            $(".select_open").on("click", function () {
                $(".block_two").hide();
                $(".block_one").show();
            })

            if ($(".zx_set_btn").hasClass("zx_set_btn_rotate")) {
                //console.log($(".create_new_nav"));
                $(".create_new_nav").addClass("create_new_nav_new")
            } else {
                $(".create_new_nav").removeClass("create_new_nav_new")
            }
            window.scrollTo(0, 0);
            $scope.ymqzfocus = function () {
                $('.houzui').css('borderColor', '#5b73eb');
            }
            $scope.ymqzblur = function () {
                $('.houzui').css('borderColor', '#d4d4d4');
            }
            function step() {
                var x = $('.scn_jindu li:nth-child(1)').children();
                $(x[0]).children('div').animate({
                    width: '40px',
                }, 300, function () {
                    $(x[1]).children('div').animate({
                        width: '100px'
                    }, 300)
                })
            }

            step();
            function animate(step) {
                if (step === 2) {
                    $scope.isActive.steptwo = true;
                } else if (step === 3) {
                    $scope.isActive.stepthree = true;
                }
                window.scrollTo(0, 0);
                var x = $('.scn_jindu li:nth-child(' + step + ')').children();
                $(x[0]).children('div').animate({
                    width: '100px',
                }, 300, function () {
                    $(x[1]).children('div').animate({
                        width: '40px'
                    }, 300, function () {
                        if (step !== 3) {
                            $(x[2]).children('div').animate({
                                width: '100px'
                            }, 300)
                        }
                    })
                })
            }

            $scope.isActive = {
                steptwo: false,
                stepthree: false
            };

            $scope.isShow = {
                step2: true,
                step3: true
            }
            $scope.backState = 1;
            $scope.nexttwo = function (step) {
                $scope.isShow.step2 = false;
                $scope.backState = 2;
                animate(step);
            }
            $scope.nextthree = function (step) {
                $scope.isShow.step3 = false;
                $scope.backState = 3;
                animate(step);
            }
            function backrestore(step) {
                var x = $('.scn_jindu li:nth-child(' + step + ')').children();
                x.each(function (v, i) {
                    console.log(v, i)
                    $(i).children('div').width('0px');
                    $scope.backState = step - 1;
                })

            }

            $scope.back = function () {
                history.back();

            }
            $scope.preStep = function (step) {
                window.scrollTo(0, 0);
                if ($scope.backState === 2) {
                    $scope.isShow.step2 = true;
                    $scope.isActive.steptwo = false;
                    backrestore($scope.backState)
                } else if ($scope.backState === 3) {
                    $scope.isShow.step3 = true;
                    $scope.isActive.stepthree = false;
                    backrestore($scope.backState)
                }
            }

            //图片预加载
            var images = new Array()
            function preload() {
                for (var i = 0; i < arguments.length; i++) {
                    images[i] = new Image()
                    images[i].src = arguments[i]
                }
            };
            preload(
                "views/service_create_new/img/add_hover.png",
                "views/service_create_new/img/del_hover.png",
                "views/service_create_new/img/input_close_hover.png",
                "views/service_create_new/img/vol_btn_hover.png",
                "views/service_create_new/img/vol_hover.png"
            );

            function initModal() {
                var widthnav = $('.create_new_nav').width();
                $('.create_new_modal').css('left', widthnav);
                var height = $(document).height();
                $('.create_new_modal').css('height', height);
            }

            initModal();
            function initModaltwo() {

                var height_child = $(window).height();
                var midheight = height_child-100;
                var width = $(document).width() - 168;
                $(".create_new_modal .selectimage_main_set").height(midheight);//选择镜像弹出内容超出-滚动条设置
                $(".create_new_modal .create_service_block").height(midheight);//申请后端服务弹出内容超出-滚动条设置
                $('.create_new_modal > div:not(:first-child)').css({
                    'height': height_child,
                    'width': width
                });
                $('.create_new_modal .content .backservice div.left > div').css('height', height_child);
                $('.create_new_modal .content .backservice div.right > div').css('height', height_child);
                $('.middle').css('height', height_child);
            }

            initModaltwo();
            $(window).resize(function () {
                initModaltwo();
            })
            $scope.isShowmodal = {
                'miyao': false,
                'chijiuhuajuan': false,
                'selectimage': false,
                'peizhijuan': false,
                'createservice': false,
                'backservice': false
            }
            /*关闭弹出层*/
            $scope.close = function (model) {
                if (model === 'cancelbsi') {
                    $scope.bsi.check=angular.copy($scope.bsi.checkcopy);
                    $scope.bsi.work=angular.copy($scope.bsi.workcopy);
                }
                var width = $('.create_new_modal').width()
                $('.create_new_modal').animate({
                    left: (width) + "px"
                }, 'normal', 'linear', function () {
                    $scope.isShowmodal[$scope.whatmodal] = false;
                    $scope.whatmodal = '';
                })

            }
            /*打开弹出层*/
            $scope.whatmodal = '';
            $scope.openModal = function (name, modal,index) {

                //console.log(index);
                if(index||index===0){
                    console.log(index);
                    $scope.changeimage=index
                }
                $scope.name = name;
                $scope.isShowmodal[modal] = true;
                $('.create_new_modal').animate({
                    left: 0
                }, 'normal', 'linear');
                $scope.whatmodal = modal;
                if (modal === 'backservice') {
                    $scope.bsi.checkcopy=angular.copy($scope.bsi.check);
                    $scope.bsi.workcopy=angular.copy($scope.bsi.work);
                }
            }
            //页面逻辑
            $scope.routeconf = {
                checkcon:'选择端口',
                checkport:'',
                host: '',
                suffix: '.like.datapp.c.citic'
            }
            $scope.changebuild= {
                ConfigChange:true,
                ImageChange:true
            }
            $scope.requests = {
                cpu: null,
                memory: null,
                inputcpu: null,
                inputmemory: null,
                usecpu: 0,
                usememory: 0,
                residuecpu: null,
                residuememory: null
            }
            $scope.copy = []
            for (var i = 1; i <= 10; i++) {
                $scope.copy.push({times: i});
            }
            //Service
            $scope.service = {
                "kind": "Service",
                "apiVersion": "v1",
                "metadata": {
                    "name": "",
                    "labels": {
                        "app": ""
                    },
                    annotations: {
                        "dadafoundry.io/create-by": $rootScope.user.metadata.name
                    }
                },
                "spec": {
                    "ports": [],
                    "selector": {
                        "app": "",
                        "deploymentconfig": ""
                    },
                    //"portalIP": "172.30.189.230",
                    //"clusterIP": "172.30.189.230",
                    "type": "ClusterIP",
                    "sessionAffinity": "None"
                }
            };

            //bsi
            $scope.bsi= {
                check:[],
                work:[]
            }
            if ($scope.updata) {
                DeploymentConfig.get({namespace: $rootScope.namespace, name:$stateParams.dc ,region:$rootScope.region}, function (res) {
                    $scope.dc = res;
                    $scope.error={
                        dcnameerr:{
                            rexed:false,
                            repeated:false,
                            null:false

                        }
                    }
                    if (!$scope.dc.spec.template.spec.volumes) {
                        $scope.dc.spec.template.spec.volumes=[];
                    }
                    //console.log('$scope.dc', $scope.dc);
                    BackingServiceInstance.get({namespace: $rootScope.namespace,region:$rootScope.region}, function (res) {
                        $log.info("backingServiceInstance", res.items);
                        $scope.bsis=res.items;
                        //$scope.bsi.work=angular.copy($scope.bsis)
                        angular.forEach(res.items, function (item,i) {
                            angular.forEach(item.spec.binding, function (bind,j) {
                                if (bind.bind_deploymentconfig === $scope.dc.metadata.name) {
                                    item.bind=true

                                }
                            })
                            if (item.bind) {
                                $scope.bsi.check.push(item);

                                //console.log('$scope.bsi',$scope.bsi);
                            }else {
                                $scope.bsi.work.push(item)
                            }


                        })



                    }, function (res) {
                        //todo 错误处理
                        // $log.info("loadBsi err", res);
                    });
                    Route.get({namespace: $rootScope.namespace,name:$scope.dc.metadata.name,region:$rootScope.region}, function (res) {
                        //Route
                        $scope.route = res;
                        $scope.routeconf.checkcon=res.spec.port.targetPort.split('-')[1];
                        $scope.routeconf.checkport=res.spec.port.targetPort.split('-')[0];
                        $scope.routeconf.host=res.spec.host.split('.like.datapp.c.citic')[0];
                        console.log('route',res);

                    }, function (err) {
                        $scope.route = {
                            "kind": "Route",
                            "apiVersion": "v1",
                            "metadata": {
                                "name": "",
                                "labels": {
                                    "app": ""
                                },
                                annotations: {
                                    "dadafoundry.io/create-by": $rootScope.user.metadata.name
                                }
                            },
                            "spec": {
                                "host": "",
                                "to": {
                                    "kind": "Service",
                                    "name": ""
                                },
                                "port": {
                                    "targetPort": ""
                                },
                                "tls": {}
                            }
                        };
                    })
                    angular.forEach($scope.dc.spec.template.spec.containers, function (con,i) {
                        if (!con.volumeMounts) {
                            con.volumeMounts=[];
                        }
                        con.imagename=con.image.split('/')[2].split('@')[0]
                        con.namerr= {
                            rexed:true,
                            repeated:true,
                            null:false
                        }

                        if (!con.env) {
                            con.env= [{name: '', value: ''}]
                        }

                        //获取卷


                        if (!con.env) {
                            con.env= [{name: '', value: ''}]
                        }
                        con.secretsobj={
                            secretarr: []
                            ,
                            configmap: []
                            ,
                            persistentarr: []

                        }
                        angular.forEach(con.volumeMounts, function (volue,k) {

                            if (volue.name.indexOf('secrat') > -1) {
                                angular.forEach($scope.dc.spec.template.spec.volumes, function (vol,j) {
                                    if (volue.name === vol.name) {
                                        var modelvol ={
                                            secret: {
                                                secretName: vol.secret.secretName
                                            },
                                            mountPath: volue.mountPath
                                        }
                                        con.secretsobj.secretarr.push(modelvol)


                                    }
                                })
                            }else if (volue.name.indexOf('config') > -1) {
                                angular.forEach($scope.dc.spec.template.spec.volumes, function (vol,j) {
                                    if (volue.name === vol.name) {
                                        var modelvol ={
                                            configMap: {
                                                name: vol.configMap.name
                                            },
                                            mountPath: volue.mountPath
                                        }
                                        con.secretsobj.configmap.push(modelvol)
                                        //con.secretsobj.configmap[j].configMap=angular.copy(vol.configMap)
                                        //console.log('config');
                                    }
                                })
                            }else if (volue.name.indexOf('persistent') > -1) {
                                angular.forEach($scope.dc.spec.template.spec.volumes, function (vol,j) {
                                    if (volue.name === vol.name) {
                                        var modelvol ={
                                            persistentVolumeClaim: {
                                                claimName: vol.persistentVolumeClaim.claimName
                                            },
                                            mountPath: volue.mountPath
                                        }
                                        con.secretsobj.persistentarr.push(modelvol)
                                        //con.secretsobj.persistentarr[j].persistentVolumeClaim=angular.copy(vol.persistentVolumeClaim)
                                        console.log('persistent');
                                    }
                                })
                            }
                        })
                        if (con.secretsobj.secretarr.length === 0) {
                            con.secretsobj.secretarr.push({
                                secret: {
                                    secretName: '名称'
                                },
                                mountPath: ''
                            })
                        }
                        if (con.secretsobj.configmap.length === 0) {
                            con.secretsobj.configmap.push({
                                configMap: {
                                    name: '名称'
                                },
                                mountPath: ''
                            })
                        }
                        if (con.secretsobj.persistentarr.length === 0) {
                            con.secretsobj.persistentarr.push({
                                persistentVolumeClaim: {
                                    claimName: '名称'
                                },
                                mountPath: ''
                            })
                        }

                        console.log(con);
                        //$scope.$apply()
                        if (con.resources.limits&&con.resources.limits.cpu && con.resources.limits.memory) {
                            con.resources.limits.cpu=parseInt(con.resources.limits.cpu)
                            con.resources.limits.memory=parseInt(con.resources.limits.memory)
                        }else {
                            con.resources.limits={}
                            con.resources.limits.cpu=0
                            con.resources.limits.memory=0
                        }
                        //console.log('con.imagename', con.imagename);
                        for(var k in $scope.dc.metadata.annotations){
                            //console.log(k.indexOf('dadafoundry.io/image-'));
                            if (k.indexOf('dadafoundry.io/image-')>-1) {
                                //console.log(k.indexOf('dadafoundry.io/image-'));
                                if ($scope.dc.metadata.annotations[k].split(':')[0] == con.name) {
                                    con.imagetag=$scope.dc.metadata.annotations[k].split(':')[1];
                                    ImageStream.get({
                                        namespace: $rootScope.namespace,
                                        region: $rootScope.region
                                    }, function (res) {
                                        $scope.updataimages = [];
                                        angular.forEach(res.items, function (item,k) {
                                            if (item.status.tags) {
                                                $scope.updataimages.push(item)
                                            }
                                        })
                                        angular.forEach($scope.updataimages, function (item,k) {
                                            //console.log('item',item);
                                            if (item.metadata.name === con.imagename) {
                                                //$scope.updataimages[i].checkbox=con.imagetag
                                                //console.log(i,$scope.dc.spec.template.spec.containers);

                                                $scope.dc.spec.template.spec.containers[i].imaged = angular.copy(item);
                                                ImageStreamTag.get({
                                                    namespace: $rootScope.namespace,
                                                    name: con.imagename + ':' + con.imagetag,
                                                    region: $rootScope.region
                                                }, function (res) {
                                                    //console.log('item.ist', res);

                                                    $scope.dc.spec.template.spec.containers[i].imaged.checkbox = con.imagetag;
                                                    //= res;
                                                    $scope.dc.spec.template.spec.containers[i].imaged.ist = res;
                                                    $scope.dc.spec.template.spec.containers[i].image = res.image.dockerImageReference;
                                                    for (var k in res.image.dockerImageMetadata.Config.ExposedPorts) {
                                                        var arr = k.split('/');
                                                        if (arr.length == 2) {
                                                            $scope.dc.spec.template.spec.containers[i].containerPort = parseInt(arr[0])
                                                            $scope.dc.spec.template.spec.containers[i].hostPort = parseInt(arr[0])
                                                        }
                                                    }
                                                    //console.log('$scope.dc.spec.template.spec.containers[i].imaged',$scope.dc.spec.template.spec.containers[i].imaged);
                                                }, function (res) {
                                                    //console.log("get image stream tag err", res);
                                                });
                                            }


                                        })

                                        console.log('$scope.images', $scope.updataimages);
                                    })

                                }
                            }
                        }

                        //console.log(con.imagename,con.imagetag);
                    })
                }, function (res) {
                    //todo 错误处理
                });
            }else {
                $scope.dc = {
                    kind: "DeploymentConfig",
                    apiVersion: "v1",
                    metadata: {
                        name: "",
                        labels: {
                            app: ""
                        },
                        annotations: {
                            "dadafoundry.io/images-from": "public",
                            "dadafoundry.io/create-by": $rootScope.user.metadata.name
                        },
                        ImageChange:true,
                        ConfigChange:true
                    },
                    spec: {
                        strategy: {},
                        triggers: [],
                        replicas: 1,
                        selector: {
                            app: "",
                            deploymentconfig: ""
                        },
                        template: {
                            metadata: {
                                labels: {
                                    app: "",
                                    deploymentconfig: ""
                                }
                            },
                            spec: {
                                containers: [{
                                    name: "",
                                    image: "",    //imageStreamTag
                                    othersetting: false,
                                    retract: false,
                                    namerr: {
                                        rexed:false,
                                        repeated:false,
                                        null:true
                                    },
                                    env: [{name: '', value: ''}],
                                    args: '',
                                    resources: {
                                        limits: {
                                            cpu: null,
                                            memory: null
                                        }
                                    },
                                    "imagePullPolicy": "Always",
                                    volumeMounts: [],
                                    secretsobj: {
                                        secretarr: [{
                                            secret: {
                                                secretName: '名称'
                                            },
                                            mountPath: ''
                                        }]
                                        ,
                                        configmap: [{
                                            configMap: {
                                                name: '名称'
                                            },
                                            mountPath: ''
                                        }]
                                        ,
                                        persistentarr: [{
                                            persistentVolumeClaim: {
                                                claimName: '名称'
                                            },
                                            mountPath: ''
                                        }]

                                    }
                                }],
                                "restartPolicy": "Always",
                                "terminationGracePeriodSeconds": 30,
                                "dnsPolicy": "ClusterFirst",
                                "securityContext": {},
                                volumes: [],

                            }
                        },
                    },
                    status: {}
                };
                //绑定dsi
//Route
                $scope.route = {
                    "kind": "Route",
                    "apiVersion": "v1",
                    "metadata": {
                        "name": "",
                        "labels": {
                            "app": ""
                        },
                        annotations: {
                            "dadafoundry.io/create-by": $rootScope.user.metadata.name
                        }
                    },
                    "spec": {
                        "host": "",
                        "to": {
                            "kind": "Service",
                            "name": ""
                        },
                        "port": {
                            "targetPort": ""
                        },
                        "tls": {}
                    }
                };
                BackingServiceInstance.get({namespace: $rootScope.namespace,region:$rootScope.region}, function (res) {
                    $scope.bsis=res.items;
                    $scope.bsi.work=angular.copy($scope.bsis)
                    //console.log('bsi',res);
                })


            }
            //Dc

            //环境变量
            $scope.addenv = function (containers) {
                containers.push({name: '', value: ''})
            }
            $scope.delenv = function (containers, i) {
                containers.splice(i, 1)

            }
            //addcon
            $scope.addcon = function () {
                $scope.dc.spec.template.spec.containers.push({
                    name: "",
                    image: "",    //imageStreamTag
                    othersetting: false,
                    retract: false,
                    namerr: {
                        rexed:false,
                        repeated:false,
                        null:true
                    },
                    env: [{name: '', value: ''}],
                    args: '',
                    resources: {
                        limits: {
                            cpu: null,
                            memory: null
                        }
                    },
                    "imagePullPolicy": "Always",
                    volumeMounts: [],
                    secretsobj: {
                        secretarr: [{
                            secret: {
                                secretName: '名称'
                            },
                            mountPath: ''
                        }]
                        ,
                        configmap: [{
                            configMap: {
                                name: '名称'
                            },
                            mountPath: ''
                        }]
                        ,
                        persistentarr: [{
                            persistentVolumeClaim: {
                                claimName: '名称'
                            },
                            mountPath: ''
                        }]

                    }
                })
                angular.forEach($scope.dc.spec.template.spec.containers,function(item,i){
                    if(i!==$scope.dc.spec.template.spec.containers.length-1){
                        item.retract = true;

                    }
                })
            }
            //高级设置
            $scope.changed = function (con) {
                con.othersetting = true
            }
            //删除con
            $scope.delcon = function($index) {
                if($scope.dc.spec.template.spec.containers.length>1){
                    $scope.dc.spec.template.spec.containers.splice($index, 1);

                }else{

                }
            }
            //收起
            $scope.pickup = function ($index) {
                $scope.dc.spec.template.spec.containers[$index].retract =true;

            }
            $scope.pickdown = function ($index) {
                angular.forEach($scope.dc.spec.template.spec.containers,function(item,i){
                    if(i==$index){
                        item.retract = false;
                    }else{
                        item.retract = true;

                    }

                })
            }
            //数据卷
            persistent.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                //console.log(res.items);
                if (res.items) {
                    //console.log(res);
                    $scope.persistentite = [];
                    angular.forEach(res.items, function (item, i) {
                        if (item.status.phase == "Bound") {
                            $scope.persistentite.push(item)
                        }
                    })
                    //angular.forEach($scope.dc.spec.template.spec.containers, function (item, i) {
                    //    $scope.dc.spec.template.spec.containers[i].secretsobj.persistentarr[0].persistentVolumeClaim.claimName = $scope.persistentite[0].metadata.name
                    //})
                    //$scope.dc.spec.template.spec.containers[]= $scope.persistentite[0].metadata.name
                    //$scope.persistentitem = res.items;
                }
            })
            $scope.persistened = function (persistentitem, name) {
                persistentitem.persistentVolumeClaim.claimName = name;
            }
            $scope.addpersistent = function (containers) {
                containers.push({
                    persistentVolumeClaim: {
                        claimName: '名称'
                    },
                    mountPath: ''
                });
            }
            $scope.delpersistent = function (containers, i) {
                containers.splice(i, 1)

            }
            //配置卷
            configmaps.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                if (res.items) {
                    $scope.configmap = res.items;
                    //angular.forEach($scope.dc.spec.template.spec.containers, function (item, i) {
                    //    $scope.dc.spec.template.spec.containers[i].secretsobj.configmap[0].configMap.name = $scope.configmap[0].metadata.name
                    //})
                }

            })
            $scope.configmaped = function (config, name) {
                config.configMap.name = name;
            }
            $scope.addconfigmap = function (containers) {
                containers.push({
                    configMap: {
                        name: '名称'
                    },
                    mountPath: ''
                });
            }
            $scope.delconfigmap = function (containers, i) {
                containers.splice(i, 1)

            }
            //密钥
            secretskey.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                //console.log('-------loadsecrets', res);
                if (res.items) {
                    $scope.secretsitems = res.items;
                    //angular.forEach($scope.dc.spec.template.spec.containers, function (item, i) {
                    //    $scope.dc.spec.template.spec.containers[i].secretsobj.secretarr[0].secret.secretName = $scope.secretsitems[0].metadata.name
                    //})
                }
            })
            $scope.secretsed = function (secret, name) {
                secret.secret.secretName = name;
            }
            $scope.addsecret = function (containers) {
                containers.push({
                    secret: {
                        secretName: '名称'
                    },
                    mountPath: ''
                });
            }
            $scope.delsecret = function (containers, i) {
                containers.splice(i, 1)

            }
            //配额
            $http.get('/api/v1/namespaces/' + $rootScope.namespace + '/resourcequotas?region=' + $rootScope.region).success(function (data) {
                if (data.items && data.items[0] && data.items[0].spec) {
                    $scope.requests.residuecpu = $scope.requests.cpu = data.items[0].spec.hard['requests.cpu'];
                    $scope.requests.residuememory = $scope.requests.memory = data.items[0].spec.hard['requests.memory'].replace('Gi', '');
                }


            })
            $scope.count = function () {
                $scope.requests.usecpu = 0;
                $scope.requests.usememory = 0;
                angular.forEach($scope.dc.spec.template.spec.containers, function (item, i) {
                    if (item.resources.limits.cpu) {
                        $scope.requests.usecpu += item.resources.limits.cpu - 0
                    }
                    if (item.resources.limits.memory) {
                        $scope.requests.usememory += item.resources.limits.memory - 0
                    }
                })
                $scope.requests.residuecpu = $scope.requests.cpu - $scope.requests.usecpu;
                $scope.requests.residuememory = $scope.requests.memory - $scope.requests.usememory;
            }


            $scope.marketclass = {
                serviceCat: 'all',
                vendor: 'all'
            }
            $scope.mymarketclass = {
                serviceCat: 'all',
                vendor: 'all'
            }
            $scope.selectServe = function (tp, key) {
                if (key === $scope.marketclass[tp]) {
                    key = 'all';
                }
                $scope.marketclass[tp] = key;
            };
            ///获得活度服务类别
            var loadBs = function () {
                BackingService.get({namespace: 'openshift', region: $rootScope.region}, function (data) {
                    $log.info('loadBs', data);
                    $scope.items = data.items;
                    var arr = data.items;
                    //上方两个tab分组数组
                    //服务分类
                    $scope.cation = [];
                    // 服务提供者
                    $scope.providers = [];
                    // 每个item中有几个对象
                    $scope.itemsDevop = [];
                    //将类名变大写
                    if (arr) {
                        for (var l = 0; l < arr.length; l++) {
                            if (arr[l].metadata.annotations && arr[l].metadata.annotations.Class !== undefined) {
                                arr[l].metadata.annotations.Class = arr[l].metadata.annotations.Class.toUpperCase()
                            } else {
                                arr[l].metadata.annotations = {
                                    Class: '其他'
                                };
                            }
                            if (arr[l].spec.metadata && !arr[l].spec.metadata.providerDisplayName) {
                                arr[l].spec.metadata.providerDisplayName = '其他'
                            }
                            if (arr[l].spec.metadata) {
                                $scope.providers.push(arr[l].spec.metadata.providerDisplayName)
                                $scope.cation.push(arr[l].metadata.annotations.Class)
                            }

                        }
                    }
                    $scope.market = data.items;
                    $scope.oldmarket = data.items;
                    //将分类去重
                    $scope.cation = $scope.cation.unique()
                    $scope.providers = $scope.providers.unique()
                })
            };
            loadBs();
            //筛选后端服务;
            $scope.$watch('marketclass', function (n, o) {
                if (n === o) {
                    return
                }
                if (n.serviceCat !== 'all' || n.vendor !== 'all') {
                    var arr = []
                    var classr = $scope.cation[n.serviceCat];
                    var labelr = $scope.providers[n.vendor];
                    angular.forEach($scope.oldmarket, function (repo, i) {
                        if (classr && labelr) {
                            if (classr === repo.metadata.annotations.Class && labelr === repo.spec.metadata.providerDisplayName) {
                                arr.push(repo);
                            }
                        } else if (classr) {
                            if (classr === repo.metadata.annotations.Class) {
                                arr.push(repo);
                            }
                        } else if (labelr) {
                            if (labelr === repo.spec.metadata.providerDisplayName) {
                                arr.push(repo);
                            }
                        }
                    })
                    $scope.market = angular.copy(arr);

                } else {
                    $scope.fiftermarket = angular.copy($scope.copymarket);
                    $scope.market = $scope.searchmarket ? angular.copy($scope.searchmarket) : angular.copy($scope.copymarket)
                }

            }, true)
            //创建持久化卷子
            //创建持久画卷
            $scope.createvolume = {
                err: {
                    blank: false,
                    valid: false
                },
                volume: {
                    name: '',
                    size: '',
                    metadata: {
                        annotations: {
                            'dadafoundry.io/create-by': $rootScope.namespace
                        }
                    }
                },
                namerr: {
                    nil: false,
                    rexed: false,
                    repeated: false
                },
                grid: {
                    inved: false,
                    num: false,
                    dianji: false
                },
                nameblur: null,    //创建持久画卷方法
                namefocus: null,
                empty: null,
                isEmpty: null,
                create: null,

                //plans
                plans: null,
                getPlan: true,

                persmnamearr: null,

                //loaing加载初始化
                loaded: true
            }
            //console.time('time');
            market.get({region: $rootScope.region, type: 'volume'}, function (data) {
                $scope.createvolume.plans = data.plans;
                console.log(data.plans, 'plan');
                console.timeEnd('time');
                $scope.createvolume.getPlan = false;

            })
            $scope.$watch('slider.value', function (n, o) {
                if (n == o) {
                    return
                }
                if (n && n > 0) {
                    $scope.createvolume.grid.num = false

                }
            })
            $scope.createvolume.nameblur = function () {
                //console.log($scope.buildConfig.metadata.name);

            }
            $scope.createvolume.namefocus = function () {
                $scope.createvolume.namerr.nil = false
            }
            persistent.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                $scope.createvolume.persmnamearr = res.items;
            })
            var rex = /^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;
            $scope.$watch('createvolume.volume.name', function (n, o) {
                if (n === o) {
                    return;
                }
                if (n && n.length > 0) {
                    if (rex.test(n)) {
                        $scope.createvolume.namerr.rexed = false;
                        $scope.createvolume.namerr.repeated = false;
                        if ($scope.createvolume.persmnamearr) {
                            //console.log($scope.buildConfiglist);
                            angular.forEach($scope.createvolume.persmnamearr, function (bsiname, i) {
                                //console.log(bsiname);
                                if (bsiname.metadata.name === n) {
                                    //console.log(bsiname,n);
                                    $scope.createvolume.namerr.repeated = true;

                                }
                                //console.log($scope.namerr.repeated);
                            })
                        }

                    } else {
                        $scope.createvolume.namerr.rexed = true;
                    }
                } else {
                    $scope.createvolume.namerr.rexed = false;
                }
            })
            $scope.createvolume.empty = function () {
                if ($scope.createvolume.volume.name === '') {

                    //alert(1)
                    $scope.createvolume.err.blank = false;
                    return
                }
            }
            $scope.createvolume.isEmpty = function () {
                if ($scope.createvolume.volume.name === '') {
                    //alert(1)
                    $scope.createvolume.err.blank = true;
                    return
                } else {
                    $scope.createvolume.err.blank = false;
                }

            }
            $scope.createvolume.creat = function () {
                if (!$scope.createvolume.namerr.nil && !$scope.createvolume.namerr.rexed && !$scope.createvolume.namerr.repeated && !$scope.timeouted) {

                } else {
                    return
                }
                var r = /^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;

                if ($scope.createvolume.volume.name === '') {
                    //alert(1)
                    $scope.createvolume.err.blank = true;
                    return
                } else if (!r.test($scope.createvolume.volume.name)) {
                    //alert(2)
                    $scope.createvolume.err.valid = true;
                    return
                }

                if ($scope.slider.value === 0) {
                    $scope.createvolume.grid.num = true;
                    return
                }
                $scope.createvolume.volume.size = $scope.slider.value;
                // console.log($scope.plans,'plans');

                angular.forEach($scope.createvolume.plans, function (plan, i) {
                    //console.log($scope.slider.value,plan.plan_level*10);

                    if ($scope.slider.value === plan.plan_level * 10) {
                        $scope.plan_id = plan.plan_id;
                        console.log(plan.plan_id, 'id')
                    }
                })

                //console.log($scope.plan_id);
                checkout.create({
                    drytry: 0,
                    plan_id: $scope.plan_id,
                    namespace: $rootScope.namespace,
                    region: $rootScope.region,
                    parameters: {
                        resource_name: $scope.createvolume.volume.name
                    }
                }, function (data) {
                    //console.log(data);
                    //volume.create({namespace: $rootScope.namespace}, $scope.volume, function (res) {
                    //    //alert(11111)
                    //    $scope.loaded = false;
                    $state.go('console.resource_management', {index: 1});
                    //}, function (err) {
                    //    $scope.loaded = false;
                    //    Toast.open('构建失败,请重试');
                    //})

                }, function (err) {
                    console.log(err.data.code);
                    $scope.createvolume.loaded = false;
                    if (err.data.code === 3316) {

                        Tip.open('提示', '账户可用余额不足。', '充值', true).then(function () {
                            $state.go('console.pay');
                        })
                    } else if (err.data.code === 3316) {
                        Tip.open('提示', '名称重复', '知道了', true).then(function () {

                        })
                    } else {

                        Tip.open('提示', '支付失败,请重试', '知道了', true).then(function () {

                        })
                    }

                })


            };
            ///添加配置文件
            $scope.volume = {
                "kind": "ConfigMap",
                "apiVersion": "v1",
                "metadata": {
                    "name": ""
                },
                "data": {},
                "configitems": [{key:'',value:''}],
                "configarr": [{key:'',value:'',showLog:false}]

            }
            $scope.postVolumeScret = false;
            $scope.checkVolume = function(res){
                $log.info('1111wew',res);
                if(!res){
                    $scope.postVolumeScret = false;
                }else{
                    $scope.postVolumeScret = true;
                }
            }
            ///添加配置文件
            $scope.add = function (idx) {
                document.getElementsByClassName('file-input')[idx].addEventListener('change', function(e){
                    var thisfilename = this.value;
                    if (thisfilename.indexOf('\\')) {
                        var arr = thisfilename.split('\\');
                        thisfilename = arr[arr.length - 1]
                    }
                    var file = e.target.files[0];
                    if (!file) {
                        return;
                    }
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var content = e.target.result;
                        $scope.volume.configarr[idx]={key: thisfilename, value: content,showLog:false};
                        $scope.$apply();
                    };
                    reader.readAsText(file);
                }, false);
            }
            $scope.addvolume = function(){
                $scope.volume.configarr.push({key:'',value:'',showLog:false});
            }
            //查看文件内容
            $scope.openValue = function(value){
                volumeConfig.open(value);
            }
            //删除配置文件列表
            $scope.deletekv = function (idx) {
                $scope.volume.configarr.splice(idx, 1);
            };


            //创建秘钥
            var Base64 = {
                _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) {
                    var t = "";
                    var n, r, i, s, o, u, a;
                    var f = 0;
                    e = Base64._utf8_encode(e);
                    while (f < e.length) {
                        n = e.charCodeAt(f++);
                        r = e.charCodeAt(f++);
                        i = e.charCodeAt(f++);
                        s = n >> 2;
                        o = (n & 3) << 4 | r >> 4;
                        u = (r & 15) << 2 | i >> 6;
                        a = i & 63;
                        if (isNaN(r)) {
                            u = a = 64
                        } else if (isNaN(i)) {
                            a = 64
                        }
                        t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
                    }
                    return t
                }, decode: function (e) {
                    var t = "";
                    var n, r, i;
                    var s, o, u, a;
                    var f = 0;
                    e = e.replace(/[^A-Za-z0-9+/=]/g, "");
                    while (f < e.length) {
                        s = this._keyStr.indexOf(e.charAt(f++));
                        o = this._keyStr.indexOf(e.charAt(f++));
                        u = this._keyStr.indexOf(e.charAt(f++));
                        a = this._keyStr.indexOf(e.charAt(f++));
                        n = s << 2 | o >> 4;
                        r = (o & 15) << 4 | u >> 2;
                        i = (u & 3) << 6 | a;
                        t = t + String.fromCharCode(n);
                        if (u != 64) {
                            t = t + String.fromCharCode(r)
                        }
                        if (a != 64) {
                            t = t + String.fromCharCode(i)
                        }
                    }
                    t = Base64._utf8_decode(t);
                    return t
                }, _utf8_encode: function (e) {
                    e = e.replace(/rn/g, "n");
                    var t = "";
                    for (var n = 0; n < e.length; n++) {
                        var r = e.charCodeAt(n);
                        if (r < 128) {
                            t += String.fromCharCode(r)
                        } else if (r > 127 && r < 2048) {
                            t += String.fromCharCode(r >> 6 | 192);
                            t += String.fromCharCode(r & 63 | 128)
                        } else {
                            t += String.fromCharCode(r >> 12 | 224);
                            t += String.fromCharCode(r >> 6 & 63 | 128);
                            t += String.fromCharCode(r & 63 | 128)
                        }
                    }
                    return t
                }, _utf8_decode: function (e) {
                    var t = "";
                    var n = 0;
                    var r = c1 = c2 = 0;
                    while (n < e.length) {
                        r = e.charCodeAt(n);
                        if (r < 128) {
                            t += String.fromCharCode(r);
                            n++
                        } else if (r > 191 && r < 224) {
                            c2 = e.charCodeAt(n + 1);
                            t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                            n += 2
                        } else {
                            c2 = e.charCodeAt(n + 1);
                            c3 = e.charCodeAt(n + 2);
                            t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                            n += 3
                        }
                    }
                    return t
                }
            }
            $scope.createsercet={
                grid:{
                    secreteno: false,
                    secretnames: true,
                    nameerr: false,
                    keychongfu: false,
                    keybuhefa: false,
                    keynull: false
                },
                secrets:{
                    "kind": "Secret",
                    "apiVersion": "v1",
                    "metadata": {
                        "name": ""
                    },
                    "data": {},
                    "secretsarr": [{
                        "key":"",
                        "value":""
                    }],
                    "type": "Opaque"
                },
                namerr:{
                    nil: false,
                    rexed: false,
                    repeated: false
                }
            }
            //$scope.secretsarr = [];
            $scope.addSecret = function () {
                $scope.createsercet.secrets.secretsarr.push({key: '', value: ''});
                //console.log($scope.secretsarr);
            }
            $scope.rmsecret = function (idx) {
                $scope.createsercet.secrets.secretsarr.splice(idx, 1);
                //if($scope.secretsarr.length<=0){
                //    $scope.grid.secreteno = false;
                //}
            }
            var by = function (name) {
                return function (o, p) {
                    var a, b;
                    if (typeof o === "object" && typeof p === "object" && o && p) {
                        a = o[name];
                        b = p[name];
                        if (a === b) {
                            return 0;
                        }
                        if (typeof a === typeof b) {
                            return a < b ? -1 : 1;
                        }
                        return typeof a < typeof b ? -1 : 1;
                    } else {
                        throw ("error");
                    }
                }
            }
            $scope.$watch('createsercet.secrets', function (n, o) {
                if (n == o) {
                    return
                }
                ;
                //console.log(n);
                $scope.createsercet.grid.keychongfu = false;
                $scope.createsercet.grid.keynull = false;
                $scope.createsercet.grid.keybuhefa = false;

                if (n.metadata.name && n.secretsarr) {
                    var arr = angular.copy(n.secretsarr);
                    arr.sort(by("key"));
                    if (arr && arr.length > 0) {
                        var kong = false;
                        var r = /^\.?[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
                        angular.forEach(arr, function (item, i) {

                            if (!item.key || !item.value) {
                                $scope.createsercet.grid.keynull = true;
                                kong = true;
                            } else {
                                if (arr[i] && arr[i + 1]) {
                                    if (arr[i].key == arr[i + 1].key) {
                                        $scope.createsercet.grid.keychongfu = true;
                                        kong = true;
                                    }
                                }
                                if (!r.test(arr[i].key)) {
                                    //console.log(arr[i].key);
                                    $scope.createsercet.grid.keybuhefa = true;
                                    kong = true;
                                }
                            }
                        });

                        if (!kong) {
                            $scope.createsercet.grid.secreteno = true
                        } else {

                            $scope.createsercet.grid.secreteno = false
                        }
                    } else {
                        $scope.createsercet.grid.secreteno = false
                    }
                } else {
                    $scope.createsercet.grid.secreteno = false
                }
            }, true);
            $scope.nameblurzn = function () {
                //console.log($scope.buildConfig.metadata.name);
                if (!$scope.createsercet.secrets.metadata.name) {
                    $scope.createsercet.namerr.nil = true
                } else {
                    $scope.createsercet.namerr.nil = false
                }
            }
            $scope.namefocuszn = function () {
                $scope.createsercet.namerr.nil = false
            }
            secretskey.get({namespace: $rootScope.namespace, region: $rootScope.region}, function (res) {
                //console.log('-------loadsecrets', res);
                $scope.secremnamearr=res.items;

            })


            var rex =/^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;

            $scope.$watch('createsercet.secrets.metadata.name', function (n, o) {
                if (n === o) {
                    return;
                }
                if (n && n.length > 0) {
                    if (rex.test(n)) {
                        $scope.createsercet.namerr.rexed = false;
                        $scope.createsercet.namerr.repeated=false;
                        if ($scope.secremnamearr) {
                            //console.log($scope.buildConfiglist);
                            angular.forEach($scope.secremnamearr, function (bsiname, i) {
                                console.log(bsiname);
                                if (bsiname.metadata.name === n) {
                                    console.log(bsiname,n);
                                    $scope.createsercet.namerr.repeated = true;

                                }
                                //console.log($scope.namerr.repeated);
                            })
                        }

                    } else {
                        $scope.createsercet.namerr.rexed = true;
                    }
                } else {
                    $scope.createsercet.namerr.rexed = false;
                }
            })

            $scope.postsecret = function () {
                if (!$scope.createsercet.namerr.nil && !$scope.createsercet.namerr.rexed && !$scope.createsercet.namerr.repeated) {

                }else {
                    return
                }
                //console.log($scope.secretsarr)
                $scope.loaded = true;
                angular.forEach($scope.createsercet.secrets.secretsarr, function (item, i) {
                    console.log(item.key, item.value);
                    $scope.createsercet.secrets.data[item.key] = Base64.encode(item.value);
                })
                delete $scope.createsercet.secrets.secretsarr;
                secretskey.create({namespace: $rootScope.namespace,region:$rootScope.region}, $scope.createsercet.secrets, function (res) {
                    $scope.createsercet.grid.nameerr = false;
                    //console.log('createconfig----',res);
                    $scope.loaded = false;
                    close()
                }, function (res) {
                    if (res.status == 409) {
                        $scope.createsercet.grid.nameerr = true;
                    }
                })

            }

            /////手动配置
            $scope.addConfig = function () {
                $scope.volume.configitems.push({key: '', value: ''});

            }
            $scope.rmovekv = function (idx) {
                $scope.volume.configitems.splice(idx, 1);
            }
            $scope.grid = {
                configpost: false,
                keychongfu: false,
                keybuhefa: false,
                keynull: false
            }
            var by = function (name) {
                return function (o, p) {
                    var a, b;
                    if (typeof o === "object" && typeof p === "object" && o && p) {
                        a = o[name];
                        b = p[name];
                        if (a === b) {
                            return 0;
                        }
                        if (typeof a === typeof b) {
                            return a < b ? -1 : 1;
                        }
                        return typeof a < typeof b ? -1 : 1;
                    } else {
                        throw ("error");
                    }
                }
            }
            ////验证配置卷的key,value
            $scope.$watch('volume', function (n, o) {
                if (n == o) {
                    return
                }
                //console.log(n);
                $scope.grid.keychongfu = false;
                $scope.grid.keynull = false;
                $scope.grid.keybuhefa = false;
                if (true) {
                    var arr = n.configitems.concat(n.configarr);
                    //var arr = n.configitems;
                    arr.sort(by("key"));

                    if (arr && arr.length > 0) {

                        var kong = false;
                        var r =/^[a-z]([a-z0-9_\.]{0,22}[a-z0-9]$)?/;
                        angular.forEach(arr, function (item, i) {
                            if (!item.key || !item.value) {
                                $scope.grid.keynull = true;
                                kong = true;
                            } else {
                                if (arr[i] && arr[i + 1]) {
                                    if (arr[i].key == arr[i + 1].key) {
                                        $scope.grid.keychongfu = true;
                                        kong = true;
                                    }
                                }
                                if (!r.test(arr[i].key)) {
                                    $scope.grid.keybuhefa = true;
                                    kong = true;
                                }
                            }
                        });
                        if (!kong) {
                            $scope.grid.configpost = true
                        } else {
                            $scope.grid.configpost = false
                        }
                    } else {
                        $scope.grid.configpost = false
                    }
                } else {
                    $scope.grid.configpost = false
                }

            }, true);

            //  验证配置卷名称
            var secretrex =/^[a-z]([a-z0-9_]{0,22}[a-z0-9]$)?/;

            $scope.$watch('volume.metadata.name', function (n, o) {
                if (n === o) {
                    return;
                }
                if (n && n.length > 0) {
                    $scope.secretNamerr.nil = false;
                    if (secretrex.test(n)) {
                        $scope.secretNamerr.rexed = false;
                        $scope.secretNamerr.repeated=false;
                        if ($scope.configmap) {
                            angular.forEach($scope.configmap, function (bsiname, i) {
                                if (bsiname.metadata.name === n) {
                                    $scope.secretNamerr.repeated = true;
                                }
                            })
                        }

                    } else {
                        $scope.secretNamerr.rexed = true;
                    }
                } else {
                    $scope.secretNamerr.rexed = false;
                }
            })
            $scope.secretNamerr = {
                nil: true,
                rexed: false,
                repeated: false
            }
            $scope.nameblur = function () {
                //console.log($scope.buildConfig.metadata.name);
                if (!$scope.volume.metadata.name) {
                    $scope.secretNamerr.nil = true
                } else {
                    $scope.secretNamerr.nil = false
                }
            }
            $scope.namefocus = function () {
                $scope.secretNamerr.nil = true
            }
            ///// 创建配置卷
            $scope.cearteconfig = function () {
                if (!$scope.secretNamerr.nil && !$scope.secretNamerr.rexed && !$scope.secretNamerr.repeated && !$scope.grid.configpost) {

                }else {
                    return;
                }
                for(var i = 0 ; i < $scope.volume.configitems.length; i++){
                    if( !$scope.volume.configitems[i].key || !$scope.volume.configitems[i].value){
                        $scope.volume.configitems.splice(i,1);
                    }
                }
                for(var i = 0 ; i < $scope.volume.configarr.length; i++){
                    if( !$scope.volume.configarr[i].key || !$scope.volume.configarr[i].value){
                        $scope.volume.configarr.splice(i,1);
                    }
                }
                var arr = $scope.volume.configitems.concat($scope.volume.configarr);

                angular.forEach(arr, function (item, i) {
                    $scope.volume.data[item.key] = item.value;
                })

                delete $scope.volume.configitems;
                delete $scope.volume.configarr;
                configmaps.create({namespace: $rootScope.namespace,region:$rootScope.region}, $scope.volume, function (res) {
                    $scope.volume = {
                        "kind": "ConfigMap",
                        "apiVersion": "v1",
                        "metadata": {
                            "name": ""
                        },
                        "data": {},
                        "configitems": [
                            {key:'',value:''}
                        ],
                        "configarr": [{key:'',value:'',showLog:false}]

                    }
                }, function (res) {
                    //$state.go('console.create_config_volume');
                })
            }
            // 创建服务
            var createService = function () {
                //prepareService($scope.service, dc);
                $scope.service.metadata.name = $scope.dc.metadata.name;
                $scope.service.metadata.labels.app = $scope.dc.metadata.name;
                $scope.service.spec.selector.app = $scope.dc.metadata.name;
                $scope.service.spec.selector.deploymentconfig = $scope.dc.metadata.name;
                var ps = [];
                console.log('$scope.dc.spec.template.spec.containers', $scope.dc.spec.template.spec.containers);
                angular.forEach($scope.dc.spec.template.spec.containers, function (con, i) {
                    //angular.forEach($scope.dc.spec.template.spec.containers, function (con, i) {
                    //        console.log('con[i].hostPort',con[i]);
                    //console.log(con);
                    ps.push({
                        name: con.hostPort + '-'+con.name,
                        port: parseInt(con.hostPort),
                        protocol: "TCP",
                        targetPort: parseInt(con.containerPort)
                    });
                })


                if (ps.length > 0) {
                    $scope.service.spec.ports = ps;
                } else {
                    $scope.service.spec.ports = [];
                }
                //$log.info('$scope.service0-0-0-0-', $scope.service.spec.ports);
                Service.create({
                    namespace: $rootScope.namespace,
                    region: $rootScope.region
                }, $scope.service, function (res) {
                    $log.info("create service success", res);
                    $scope.service = res;
                }, function (res) {
                    $log.info("create service fail", res);
                });
            };
            // 创建路由
            var createRoute = function (service) {
                $scope.route.metadata.name = $scope.dc.metadata.name;
                $scope.route.metadata.labels.app = $scope.dc.metadata.name;
                $scope.route.spec.host = $scope.routeconf.host + $scope.routeconf.suffix;
                $scope.route.spec.to.name = $scope.dc.metadata.name;
                //选择的route的端口
                $scope.route.spec.port.targetPort = $scope.routeconf.checkport +'-'+$scope.routeconf.checkcon;
                Route.create({
                    namespace: $rootScope.namespace,
                    region: $rootScope.region
                }, $scope.route, function (res) {
                    $log.info("create route success", res);
                    $scope.route = res;
                }, function (err) {
                    $log.info("create route fail", err);

                });
            };
            //选择镜像
            ImageStream.get({
                namespace: $rootScope.namespace,
                region: $rootScope.region
            }, function (res) {
                $scope.images = [];
                angular.forEach(res.items, function (item,i) {
                    if (item.status.tags) {
                        $scope.images.push(item)
                    }
                })
                angular.forEach($scope.images, function (item,i) {
                    $scope.images[i].checkbox=item.status.tags[0].tag.split('-').length>1?item.status.tags[0].tag.split('-')[1]:item.status.tags[0].tag
                })
                console.log('$scope.images', $scope.images);


            })
            $scope.checkboximage= function (image) {
                console.log('$scope.changeimage', image);

                ImageStreamTag.get({
                    namespace: $rootScope.namespace,
                    name: image.metadata.name + ':' + image.checkbox,
                    region: $rootScope.region
                }, function (res) {
                    console.log('item.ist', res);

                    $scope.dc.spec.template.spec.containers[$scope.changeimage].imaged = image;
                    //= res;
                    $scope.dc.spec.template.spec.containers[$scope.changeimage].imaged.ist = res;
                    $scope.dc.spec.template.spec.containers[$scope.changeimage].image = res.image.dockerImageReference;
                    for (var k in res.image.dockerImageMetadata.Config.ExposedPorts) {
                        var arr = k.split('/');
                        if (arr.length == 2) {
                            $scope.dc.spec.template.spec.containers[$scope.changeimage].containerPort = parseInt(arr[0])
                            $scope.dc.spec.template.spec.containers[$scope.changeimage].hostPort = parseInt(arr[0])
                        }
                    }

                    $scope.close();
                }, function (res) {
                    //console.log("get image stream tag err", res);
                });
            }

            $scope.addbsi= function (bsisd) {
                angular.forEach($scope.bsi.work, function (bsi,i) {
                    if (bsi.metadata.name === bsisd.metadata.name) {
                        $scope.bsi.work.splice(i,1)
                    }
                })
                $scope.bsi.check.push(bsisd)
                //console.log('$scope.bsi', $scope.bsi);
            }

            $scope.delbsi= function (bsisd) {
                angular.forEach($scope.bsi.check, function (bsi,i) {
                    if (bsi.metadata.name === bsisd.metadata.name) {
                        $scope.bsi.check.splice(i,1)
                    }
                })
                $scope.bsi.work.push(bsisd);

            }

            var bindService = function (dc) {
                angular.forEach($scope.bsi.check, function (bsi) {
                    var bindObj = {
                        metadata: {
                            name: bsi.metadata.name,
                            annotations: {
                                "dadafoundry.io/create-by": $rootScope.user.metadata.name
                            }
                        },
                        resourceName: dc.metadata.name,
                        bindResourceVersion: '',
                        bindKind: 'DeploymentConfig'
                    };


                    //if (bsi.bind) {  //未绑定设置为绑定
                    BackingServiceInstance.bind.create({
                        namespace: $rootScope.namespace,
                        name: bsi.metadata.name,
                        region: $rootScope.region
                    }, bindObj, function (res) {
                        $log.info("bind service success", res);
                    }, function (res) {
                        $log.info("bind service fail", res);
                    });
                    //}
                });
            };
            var updataRoute= function () {
                $scope.route.spec.host = $scope.routeconf.host + $scope.routeconf.suffix;
                console.log('updataRoute');
                Route.put({
                    namespace: $rootScope.namespace,
                    name: $scope.dc.metadata.name,
                    region:$rootScope.region
                }, $scope.route, function (res) {
                    $log.info("create route success", res);
                    //alert(111)
                    //$scope.route = res;
                }, function (err) {
                    // $log.info("create route fail", res);
                });
            }
            $scope.creat = function () {

                //挂卷
                var clonedc = angular.copy($scope.dc);
                angular.forEach(clonedc.spec.template.spec.containers, function (con, i) {
                    var imagetag = 'dadafoundry.io/image-' + con.name;
                    clonedc.metadata.annotations[imagetag] = con.name + ":" + con.imaged.checkbox;
                    if (con.args) {
                        clonedc.spec.template.spec.containers[i].args= clonedc.spec.template.spec.containers[i].args.split(' ');
                    }else {
                        delete clonedc.spec.template.spec.containers[i].args
                    }
                    angular.forEach(con.env, function (envd,j) {
                        if (envd.name === '') {
                            //console.log('envd.name', envd.name);
                            delete clonedc.spec.template.spec.containers[i].env.splice(i,1)
                        }
                    })
                    if (clonedc.spec.template.spec.containers[i].env.length === 0) {
                        console.log('delete');
                        delete clonedc.spec.template.spec.containers[i].env
                    }

                    console.log(clonedc, '!clonedc.othersetting');
                    if (!con.othersetting) {
                        delete clonedc.spec.template.spec.containers[i].secretsobj
                        delete clonedc.spec.template.spec.containers[i].env
                        delete clonedc.spec.template.spec.containers[i].args
                    } else {
                        console.log(con.secretsobj.secretarr.length);
                        if (con.secretsobj.secretarr.length > 0) {
                            console.log(con.secretsobj.secretarr);
                            angular.forEach(con.secretsobj.secretarr, function (secret, k) {
                                if (clonedc.spec.template.spec.containers[i].secretsobj.secretarr[k].secret.secretName !== '名称') {
                                    secret.name = "con" + i + "secrat" + k;
                                    var secretcopy = angular.copy(secret);
                                    clonedc.spec.template.spec.volumes.push(secretcopy)
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.secretarr[k].secret
                                    con.volumeMounts.push(clonedc.spec.template.spec.containers[i].secretsobj.secretarr[k])
                                } else {
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.secretarr[k]
                                }


                            });

                        }
                        if (con.secretsobj.configmap.length > 0) {
                            angular.forEach(con.secretsobj.configmap, function (config, k) {
                                if (clonedc.spec.template.spec.containers[i].secretsobj.configmap[k].configMap.name !== '名称') {
                                    config.name = "con" + i + "config" + k;
                                    var configcopy = angular.copy(config);
                                    clonedc.spec.template.spec.volumes.push(configcopy)
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.configmap[k].configMap
                                    con.volumeMounts.push(clonedc.spec.template.spec.containers[i].secretsobj.configmap[k])
                                }else {
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.configmap[k]
                                }

                            });

                        }
                        if (con.secretsobj.persistentarr.length > 0) {

                            angular.forEach(con.secretsobj.persistentarr, function (persistent, k) {
                                if (clonedc.spec.template.spec.containers[i].secretsobj.persistentarr[k].persistentVolumeClaim.claimName !== '名称') {
                                    persistent.name = "con" + i + "persistent" + k;
                                    var persistentcopy = angular.copy(persistent);
                                    clonedc.spec.template.spec.volumes.push(persistentcopy)
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.persistentarr[k].persistentVolumeClaim.claimName
                                    con.volumeMounts.push(clonedc.spec.template.spec.containers[i].secretsobj.persistentarr[k])
                                }else {
                                    delete clonedc.spec.template.spec.containers[i].secretsobj.persistentarr[k]
                                }
                            });


                        }
                        delete clonedc.spec.template.spec.containers[i].secretsobj
                    }
                    if (clonedc.spec.template.spec.containers[i].resources.limits.cpu && clonedc.spec.template.spec.containers[i].resources.limits.memory) {

                    }else {
                        delete clonedc.spec.template.spec.containers[i].resources
                    }


                })
                angular.forEach(clonedc.spec.template.spec.volumes, function (volume, i) {
                    delete clonedc.spec.template.spec.volumes[i].mountPath
                })

                //镜像变化触发自动部署
                if ($scope.changebuild.ConfigChange) {
                    clonedc.spec.triggers.push({type: 'ConfigChange'});
                }

                if ($scope.changebuild.ImageChange) {
                    clonedc.spec.triggers.push({
                        "type": "ImageChange",
                        "imageChangeParams": {
                            "automatic": true,
                            "containerNames": [
                                clonedc.spec.template.spec.containers[0].name
                            ],
                            "from": {
                                "kind": "ImageStreamTag",
                                "name": clonedc.spec.template.spec.containers[0].imaged.metadata.name+':'+clonedc.spec.template.spec.containers[0].imaged.checkbox
                            }
                        }
                    });
                }

                //prepareDc
                var name = clonedc.metadata.name;
                clonedc.metadata.labels.app = name;
                clonedc.spec.selector.app = name;
                clonedc.spec.selector.deploymentconfig = name;
                clonedc.spec.template.metadata.labels.app = name;
                clonedc.spec.template.metadata.labels.deploymentconfig = name;
                //镜像变化触发自动部署
                //if ($scope.grid.configChange) {
                //    dc.spec.triggers.push({type: 'ConfigChange'});
                //}
                //addport
                // 删除同名服务,创建dc之前执行该方法
                //console.log('clonedc', clonedc);
                if ($scope.updata) {
                    if ($scope.routeconf.host&&$scope.route.metadata.resourceVersion) {
                        //console.log('$scope.grid.port',$scope.grid.port);
                        //createRoute();
                        updataRoute()
                    }else {
                        createRoute()
                    }
                    DeploymentConfig.get({namespace: $rootScope.namespace, name:$stateParams.dc ,region:$rootScope.region}, function (res) {

                        //clonedc.
                        clonedc.metadata.resourceVersion=res.metadata.resourceVersion
                        DeploymentConfig.put({
                            namespace: $rootScope.namespace,
                            name: clonedc.metadata.name,
                            region: $rootScope.region
                        }, clonedc, function (res) {
                            // $log.info("update dc success", res);
                            //$scope.getdc.spec.replicas = $scope.dc.spec.replicas;
                            bindService(clonedc);
                            $state.go('console.service_detail', {name: clonedc.metadata.name,from: 'create'});
                        }, function (res) {
                            //todo 错误处理

                            // $log.info("update dc fail", res);
                        });
                    }, function (err) {

                    })

                }else {
                    Service.delete({
                        namespace: $rootScope.namespace,
                        name: clonedc.metadata.name,
                        region: $rootScope.region
                    }, function (res) {
                        //console.log("deleService-yes", res);
                    }, function (res) {
                        //console.log("deleService-no", res);
                    })
                    //  删除同名路由,创建dc之前执行该方法
                    Route.delete({
                        namespace: $rootScope.namespace,
                        name: clonedc.metadata.name,
                        region: $rootScope.region
                    }, function (res) {
                    }, function (res) {

                    })
                    createService();
                    //console.log('$scope.routeconf.route', $scope.routeconf.route);

                    if ($scope.routeconf.host) {
                        //console.log('$scope.grid.port',$scope.grid.port);
                        createRoute();
                    }
                    DeploymentConfig.create({
                        namespace: $rootScope.namespace,
                        region: $rootScope.region
                    }, clonedc, function (res) {
                        $log.info("create dc success", res);
                        bindService(clonedc);
                        $state.go('console.service_detail', {name: clonedc.metadata.name, from: 'create'});
                    }, function (res) {
                        //todo 错误处理
                        $log.info("create dc fail", res);
                        if (res.status == 409) {
                            $scope.grid.createdcerr = true;
                        }
                    });
                }

            }
        }]);
