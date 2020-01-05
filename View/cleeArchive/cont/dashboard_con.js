app.filter('introType', function() { //可以注入依赖
    return function(info) {
        if(!info || info == '')
            return '作者很懒，什么也没写。';
        else
            return info;
    }
});

app.filter('tagFilter',function(){
    return function(input){
        let newArr = [];
        input.map(function(item,i,arr){
            if(item.type != 4)
                newArr.push(item);
        });
        return newArr;
    }
});

app.directive('infoReceiver',function($rootScope){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.userSetting = JSON.parse(scope.userSetting);
        }
    }
});

app.controller("dashboard_con",function($scope,$rootScope,userManager){
    $scope.contentsLoaded = false;

    $scope.error = '';
    $scope.showError = false;

    $scope.subPage = $rootScope.query.pageId || 0;

    $scope.updatesInfo = [];

    $scope.userSetting = null;
    $scope.userId = '';

    let publishError = function(){

    };

    $scope.$on('dashboardRequestFinished',function(event,data){
        if(data.success)
        {
            $scope.updatesInfo = data.result || [];
        }
        else
        {
            $scope.showError =true;
            $scope.error = data.info;
        }
    });

    //界面

    userManager.requestDashboard($rootScope.query,$rootScope.userId);

});


