'use strict';

angular.module("console.sidebar", [
    {
        files: ['components/sidebar/sidebar.css']
    }
])

    .directive('cSidebar', [function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'components/sidebar/sidebar.html',
            controller: ['$state', '$scope', function($state, $scope){
                $scope.$state = $state;
                var width = 0;
                $(".create_new_nav").addClass("create_new_nav_new");
                $(".create_new_nav2").addClass("create_new_nav_new");
                $("#sidebar-container").addClass("sider_zx");
                $("#sidebar-right-fixed").addClass("sidebar-fixed");
                width = $(window).width()-168;
                $(".zx_set_btn").on("click",function(){
                    //var width = 0;
                    var height = $(document).height()
                    $(this).toggleClass("zx_set_btn_rotate");
                    $(".create_new_nav").toggleClass("create_new_nav_new");
                    $(".create_new_nav2").toggleClass("create_new_nav_new");
                    if ($(this).hasClass("zx_set_btn_rotate")) {

                        //$(".create_new_nav").addClass("create_new_nav_new");
                        //$(".create_new_nav2").addClass("create_new_nav_new");
                        width = $(window).width()-52;

                    }else {

                        $(".create_new_nav").addClass("create_new_nav_new");
                        $(".create_new_nav2").addClass("create_new_nav_new");
                        width = $(window).width()-168;
                    //    $(".create_new_nav").removeClass("create_new_nav_new");
                    //    $(".create_new_nav2").removeClass("create_new_nav_new");
                        //width = $(window).width()-168;


                    }
                    $("#sidebar-container").toggleClass("sider_zx");
                    $("#sidebar-right-fixed").toggleClass("sidebar-fixed");
                    $('.create_new_modal > div:not(:first-child)').css({
                        'width':width,
                        'height':height
                    })
                });


                $scope.$watch('$state.current.name',function (n,o) {
                    //console.time('time')
                    console.log('$state', n);
                    //代码构建
                    if (n === 'console.build_create_new' || n === 'console.build_detail'|| n==='console.build') {
                        $scope.build = true;
                    }else {
                        $scope.build = false;
                    };
                    //镜像仓库
                    if (n === 'console.image' ||  n === 'console.image_detail') {
                        $scope.depot = true
                    }else {
                        $scope.depot = false
                    };
                    //服务部署 console.service_create
                    if (n === 'console.service' ||  n === 'console.service_create' ||  n === 'console.service_detail') {
                        $scope.deploy = true
                    }else {
                        $scope.deploy = false
                    };

                    //后端服务
                    if (n === 'console.backing_service' || n === 'console.apply_instance' ||  n === 'console.backing_service_detail' ||  n === 'console.create_saas' ) {
                        $scope.back_services = true
                    }else {
                        $scope.back_services = false
                    }

                    //资源管理
                    if (n === 'console.constantly_detail'|| n === 'console.secret_detail' || n === 'console.config_detail' || n === 'console.resource_management' || n === 'console.create_constantly_volume' || n === 'console.create_config_volume' ||  n === 'console.create_secret') {
                        $scope.resour_manage = true
                    }else {
                        $scope.resour_manage = false
                    }

                    //数据集成
                    if (n === 'console.Integration_dlist' || n === 'console.Integration' || n === 'console.Integration_detail' ||  n === 'console.dataseverdetail') {
                        $scope.data_inter = true
                    }else {
                        $scope.data_inter = false
                    }
                    //console.timeEnd('time')
                    //$scope.$apply()
                    //console.log('$scope.build', $scope.build);
                })

            }]
        }
    }]);



