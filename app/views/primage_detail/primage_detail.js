'use strict';

angular.module('console.image_detail', [
        {
            files: [
                'components/searchbar/searchbar.js',
                'views/primage_detail/primage_detail.css'
            ]
        }
    ])
    .controller('prImageDetailCtrl', ['pubregistrytag','Confirm','ModalPullImage', '$state', 'ImageStream', '$http', 'platformone', 'platformlist', '$location', '$rootScope', '$scope', '$log', 'ImageStreamTag', '$stateParams',
        function (pubregistrytag,Confirm,ModalPullImage, $state, ImageStream, $http, platformone, platformlist, $location, $rootScope, $scope, $log, ImageStreamTag, $stateParams) {


            pubregistrytag.get({namespace:$rootScope.namespace,name:$stateParams.name}, function (tag) {
                console.log('tag', tag);
                $scope.data = tag
                $scope.tags=tag.tags
                //console.log('$scope.primage', $scope.primage);
            })


        }]);