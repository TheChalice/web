'use strict';
angular.module('console.image', [
        {
            files: [
                'components/searchbar/searchbar.js',
                'components/card/card.js',
                'views/image/image.css'
            ]
        }
    ])
    .controller('ImageCtrl', ['$scope', '$log','ImageStreamTag', 'Build', 'GLOBAL', function ($scope, $log, ImageStreamTag, Build, GLOBAL) {

        //分页
        $scope.grid = {
            page: 1,
            size: GLOBAL.size
        };

        $scope.$watch('grid.page', function(newVal, oldVal){
            if (newVal != oldVal) {
                refresh(newVal);
            }
        });

        var refresh = function(page) {
            var skip = (page - 1) * $scope.grid.size;
            $scope.items = $scope.data.items.slice(skip, skip + $scope.grid.size);
        };

        var loadImageStream = function() {
            ImageStreamTag.get(function(data){
                $log.info('imageStream', data);
                $scope.data = data;
                $scope.grid.total = data.items.length;
                refresh(1);

                loadBuilds(data.items);
            }, function (res) {
                //错误处理
            });
        };

        loadImageStream();

        var loadBuilds = function(items){
            //todo 通过labelSelector筛选builds,现在无法拿到数据
            //var labelSelector = '';
            //for (var i = 0; i < items.length; i++) {
            //    labelSelector += 'buildconfig=' + items[i].metadata.name + ','
            //}
            //labelSelector = labelSelector.substring(0, labelSelector.length - 1);
            //Build.get({labelSelector: labelSelector}, function (data) {
            Build.get(function (data) {
                $log.info("builds", data);

                fillImageStreams(data.items);
            });
        };

        var fillImageStreams = function(items) {

        };
    }]);
