
app.filter('tagFilter',function(){
    return function(input){
        if(!input || !input.length)
            return [];
        return input.sort(function(a,b){
            if(b.totalCount != a.totalCount)
                return b.totalCount - a.totalCount;
            else
                return a.tag.name > b.tag.name;
        })

    }
});

app.directive('infoReceiver',function($rootScope){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.userSetting = JSON.parse(scope.userSetting);
            scope.count = JSON.parse(scope.count);
            if(!scope.count['0'])
                scope.count['0'] = 0;
            if(!scope.count['5'])
                scope.count['5'] = 0;
            if(!scope.count['10'])
                scope.count['10'] = 0;
            console.log(scope.count);
            scope.gradeTemplate = JSON.parse(scope.gradeTemplate);
            scope.tagList = JSON.parse(scope.tagList);
            scope.initialize();
        }
    }
});


app.controller("dashboard_con",function($scope,$rootScope,userManager){
    $scope.contentsLoaded = false;

    $scope.error = '';
    $scope.showError = false;

    $scope.maxLimit = 0;
    $scope.pageMax = 1;
    $scope.pageId = $rootScope.query.pageId || 0;
    $scope.subPageIndex = $rootScope.query.subPageIndex || 0;

    $scope.count = {};

    $scope.tagList = [];

    $scope.receivedList = [];

    $scope.gradeTemplate = [];

    $scope.userSetting = null;

    $scope.$on('dashboardRequestFinished',function(event,data){
        $scope.contentsLoaded = true;
        if(data.success)
        {
            $scope.receivedList = data.result || [];
            $scope.maxLimit = data.maxLimit || 0;
            $scope.pageMax = Math.ceil($scope.maxLimit / 10);
            if($scope.pageMax == 0)
                $scope.pageMax += 1;
        }
        else
        {
            $scope.showError =true;
            $scope.error = data.info;
        }
    });

    let calcAddress = function(index){
        let query = $rootScope.query;
        let queryString = '?';
        for (let key in query){
            if(queryString != '?')
                queryString += '&';
            if(key != 'subPage')
                 queryString += key+'='+query[key];
            else
                queryString  += key+'='+index.toString();
        };
        if(queryString.indexOf('subPage') == -1)
            queryString  += key+'='+index.toString();

        return '/users/'+$rootScope.userId+queryString;
    };

    $scope.gotoPage = function(index){
        window.location.href = calcAddress(index);
    };

    $scope.searchTag= function(tagName,type){
       return '/search/tag?id='+ escape(tagName);
    };
    //界面

    $scope.initialize = function(){
        let data = $rootScope.query;
        if(data.pageId == 1020)
        {
            $scope.contentsLoaded = true;
            return;
        }
        data.userSetting = $scope.userSetting;
        userManager.requestDashboard(data,$rootScope.userId);
    };
});


