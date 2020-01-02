app.filter('introType', function() { //可以注入依赖
    return function(info) {
        if(!info || info == '')
            return '作者很懒，什么也没写。';
        else
            return info;
    }
});

app.directive('infoReceiver',function($rootScope){
    return {
        restrict: 'E',
        link:function(scope,element,attr){

        }
    }
});

app.controller("dashboard_con",function($scope,$http,$rootScope,$interval,$timeout,$window,$location){
    $scope.contentsLoaded = false;

    $scope.userSetting = null;
    $scope.userId = '';

    //界面

    console.log('entered');
});


