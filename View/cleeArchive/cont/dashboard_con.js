
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


app.controller("dashboard_con",function($scope,$rootScope,userManager,fanficManager,$timeout){
    $scope.contentsLoaded = false;

    $scope.alertInfo = '';
    $scope.showAlert = false;

    $scope.error = '';
    $scope.showError = false;

    $scope.maxLimit = 0;
    $scope.pageMax = 1;
    $scope.pageId = $rootScope.query.pageId || 0;
    $scope.subPageIndex = $rootScope.query.subPageIndex || 0;

    $scope.count = {};

    $scope.tagList = [];

    $scope.receivedList = [];
    $scope.deleteList = [];

    $scope.gradeTemplate = [];

    $scope.userSetting = null;

    let resetHeight = function(){
        let main = document.getElementById('main');
        let sl = document.getElementById('userPageContents');
        if(main.offsetHeight < sl.scrollHeight)
        {
            main.style.minHeight = sl.scrollHeight+50+'px';
        }
    };

    $scope.$on('dashboardRequestFinished',function(event,data){
        $scope.contentsLoaded = true;
        if(data.success)
        {
            $scope.receivedList = data.result || [];
            $scope.maxLimit = data.maxLimit || 0;
            $scope.pageMax = Math.ceil($scope.maxLimit / 10);
            if($scope.pageMax == 0)
                $scope.pageMax += 1;
            $timeout(resetHeight,100);
        }
        else
        {
            $scope.showError =true;
            $scope.error = data.info;
        }
    });

    $scope.$on('deleteReceivedList',function(event,data){
        for(let i=0;i<$scope.receivedList.length;++i)
        {
            if(i >= $scope.receivedList.length)
                break;
            let item = $scope.receivedList[i];
            if(item.infoType == data.infoType && item.chapter._id == data.index.chapter)
            {
                $scope.deleteList.push({index:i,item:item});
                $scope.receivedList.splice(i,1);
                i--;
            }
            else if(data.infoType == 0 && item.work._id == data.index.work)
            {
                $scope.deleteList.push({index:i,item:item});
                $scope.receivedList.splice(i,1);
                i--;
            }
            else if(data.infoType == 1 && data.index.prev == null && item.work._id == data.index.work && item.work.chapterCount <= 1)
            {
                $scope.deleteList.push({index:i,item:item});
                $scope.receivedList.splice(i,1);
                i--;
                data.infoType = 0;
            }
            if(data.infoType ==1 && item.work._id == data.index.work)
            {
                item.work.chapterCount --;
            }
        }
        fanficManager.removePost(data);
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


