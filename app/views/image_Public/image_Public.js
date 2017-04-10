'use strict';

angular.module('console.image_Public', [
        {
            files: [
                'components/searchbar/searchbar.js',
            ]
        }
    ])
    .controller('imagePublicCtrl', ['platformone','platformlist','ModalPullImage','$http','$state','$scope',
        function (platformone,platformlist,ModalPullImage,$http,$state,$scope){
            //console.log($state.params.name);
            $scope.name=$state.params.name;
            $scope.lastname=$state.params.name.split('/')[1];
            platformlist.query({id:$state.params.name}, function (tags) {
                console.log('tags',tags);
                angular.forEach(tags, function (tag,i) {
                    platformone.get({id:$scope.name,tag:tag}, function (tagmessage) {
                        $scope.items=[]
                        $scope.items.push({tag:tag,tagcen:tagmessage});
                        if ($scope.items.length == tags.length) {
                            //console.log($scope.items);

                            angular.forEach($scope.items, function (item,i) {
                                $scope.items[i].sorttime=(new Date(item.tagcen.Created)).getTime()
                            })
                            //console.log($scope.items);
                            $scope.items.sort(function (x, y) {
                                return x.sorttime > y.sorttime ? -1 : 1;
                            });
                            //console.log($scope.items);
                        }
                    })

                })
            })
            //$http.get('/registry/api/repositories/tags', {
            //    params: {repo_name:$state.params.name}})
            //    .success(function (tags) {
            //        //console.log(tags);
            //
            //    });
            $scope.pull = function(name){

                //var s = $scope.name;

                var str = $scope.name+':'+name
                ModalPullImage.open(str)
                    .then(function(res){
                        //console.log("cmd1", res);
                    });
            };
        }])

