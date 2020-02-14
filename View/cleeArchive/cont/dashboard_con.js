
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


app.controller("dashboard_con",['$scope','$rootScope','$location','userManager','fanficManager',function($scope,$rootScope,$location,userManager,fanficManager){
    $scope.contentsLoaded = false;

    $scope.alertInfo = '';
    $scope.showAlert = false;

    $scope.error = '';
    $scope.showError = false;

    $scope.maxLimit = 0;
    $scope.pageId = $rootScope.query.pageId || 0;
    $scope.perPage = 15;
    let queryStr = $location.search();
    $scope.pageIndex = queryStr.pid? Number(queryStr.pid) : 1;

    $scope.count = {};

    $scope.tagList = [];

    $scope.receivedList = [];
    $scope.deleteList = [];

    $scope.gradeTemplate = [];

    $scope.userSetting = null;

    $scope.$on('pageChange',function(event,data){
        $scope.pageIndex = data.pid;
        $location.search('pid',$scope.pageIndex);
        $scope.receivedList.length = 0;
        $scope.contentsLoaded = false;
        $scope.initialize();
    });

    $scope.$on('dashboardRequestFinished',function(event,data){
        $scope.contentsLoaded = true;
        if(data.success)
        {
            $scope.receivedList = data.result || [];
            $scope.maxLimit = data.maxLimit || 0;
            $scope.$broadcast('updatePageIndex',{totalNum:$scope.maxLimit,pageId:$scope.pageIndex});
        }
        else
        {
            $scope.showError =true;
            $scope.error = data.message;
        }
        $scope.$broadcast('pageChangeFinished');
    });

    $scope.$on('deleteReceivedList',function(event,data){
        if($scope.deletingPost)
        {
            $scope.$emit('showError','您删除得太快了，请稍候再操作')
            return;
        }
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
            if(data.infoType === 1 && item.work._id === data.index.work)
            {
                item.work.chapterCount --;
            }
        }
        $scope.deletingPost = true;
        fanficManager.removePost(data);
    });

    $scope.$on('postRemoved',function(event,data){
        $scope.deletingPost = false;
        if(data.success)
        {
            $scope.deleteList = [];
        }
        else{
            for(let i = $scope.deleteList.length; i>=0; --i)
            {
                $scope.receivedList.splice($scope.deleteList[i].index,0,$scope.deleteList[i].item);
            }
            $scope.$emit('showError',data.message);
        }
    });

    let calcAddress = function(index){
        let query = $rootScope.query;
        let queryString = '?';
        for (let key in query){
            if(queryString !== '?')
                queryString += '&';
            if(key !== 'subPage')
                 queryString += key+'='+query[key];
            else
                queryString  += key+'='+index.toString();
        };
        if(queryString.indexOf('subPage') === -1)
            queryString  += key+'='+index.toString();

        return '/users/'+$rootScope.userId+queryString;
    };

    //界面

    $scope.initialize = function(){
        let data = $rootScope.query;
        data.subPage = $scope.pageIndex || 1;
        data.perPage = $scope.perPage ||15;
        if(data.pageId == 1020)
        {
            $scope.contentsLoaded = true;
            return;
        }
        data.userSetting = $scope.userSetting;
        userManager.requestDashboard(data,$rootScope.userId);
    };
}]);


