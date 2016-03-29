angular.module("console.build.detail",[{files:["components/timeline/timeline.js","components/checkbox/checkbox.js","views/build_detail/build_detail.css"]}]).controller("BuildDetailCtrl",["$scope","$log","$stateParams","$state","BuildConfig","Build","Sort","Confirm",function(e,t,n,r,i,s,o,u){e.grid={};var a=function(){i.get({name:n.name},function(n){t.info("data",n),e.data=n,n.spec&&n.spec.completionDeadlineSeconds&&(e.grid.completionDeadlineMinutes=parseInt(n.spec.completionDeadlineSeconds/60)),f()},function(e){})},f=function(){s.get({labelSelector:"buildconfig="+e.data.metadata.name},function(n){t.info("history",n),n.items=o.sort(n.items,-1),e.history=n,l(n.metadata.resourceVersion),e.imageEnable=h()},function(e){})};a();var l=function(e){s.watch(function(e){var t=JSON.parse(e.data);c(t)},function(){t.info("webSocket start")},function(){t.info("webSocket stop")},e)},c=function(t){t.type!="ADDED"&&t.type=="MODIFIED"&&angular.forEach(e.history.items,function(n,r){n.metadata.name==t.object.metadata.name&&(t.object.showLog=e.history.items[r].showLog,s.log.get({name:t.object.metadata.name},function(n){var i="";for(var s in n)i+=n[s];t.object.buildLog=i,e.history.items[r]=t.object},function(){e.history.items[r]=t.object}))})},h=function(){return!e.data||!e.data.spec.output||!e.data.spec.output.to||!e.data.spec.output.to.name?!1:!e.history||e.history.items.length==0?!1:e.history.items.length==1&&e.history.items[0].status.phase!="Complete"?!1:!0};e.startBuild=function(){var n=e.data.metadata.name,r={metadata:{name:n}};i.instantiate.create({name:n},r,function(n){t.info("build instantiate success"),e.history.items?(n.showLog=!0,e.history.items.unshift(n)):e.history.items=[n]},function(e){})},e.delete=function(){var n=e.data.metadata.name;u.open("删除构建","您确定要删除构建吗?","删除构建将清除构建的所有历史数据以及相关的镜像该操作不能被恢复","recycle").then(function(){i.remove({name:n},{},function(){t.info("remove buildConfig success"),e.imageEnable=h(),r.go("console.build")},function(e){})})},e.save=function(){if(!e.deadlineMinutesEnable){e.deadlineMinutesEnable=!0;return}var n=e.data.metadata.name;e.data.spec.completionDeadlineSeconds=e.grid.completionDeadlineMinutes*60,i.put({name:n},e.data,function(n){t.info("put success",n),e.deadlineMinutesEnable=!1},function(e){t.info("put failed")})}}]);