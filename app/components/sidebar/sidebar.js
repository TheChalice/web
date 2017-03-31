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

                $(".zx_set_btn").on("click",function(){
                    var width = 0;
                    var height = $(document).height()
                    $(this).toggleClass("zx_set_btn_rotate");
                    if ($(this).hasClass("zx_set_btn_rotate")) {
                        $(".create_new_nav").addClass("create_new_nav_new");
                        $(".create_new_nav2").addClass("create_new_nav_new");
                        width = $(window).width()-52;

                    }else {
                        $(".create_new_nav").removeClass("create_new_nav_new");
                        $(".create_new_nav2").removeClass("create_new_nav_new");
                        width = $(window).width()-168;
                    }
                    $("#sidebar-container").toggleClass("sider_zx");
                    $("#sidebar-right-fixed").toggleClass("sidebar-fixed");
                    $('.create_new_modal > div:not(:first-child)').css({
                        'width':width,
                        'height':height
                    })
                });
            }]
        }
    }]);



