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
            var namespace=$stateParams.name.split('/')[0];
            var name=$stateParams.name.split('/')[1];

            pubregistrytag.get({namespace:namespace,name:name}, function (tag) {
                console.log('tag', tag);
                $scope.data = tag
                $scope.tags=tag.tags

                //console.log('$scope.primage', $scope.primage);
            })
            $scope.pull = function (name) {
                var s = $scope.data.name;
                //console.log(name);
                var str =s + ':' + name
                ModalPullImage.open(str)
                    .then(function (res) {

                        //console.log("cmd1", res);
                    });
            };


        }]);