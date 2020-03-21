
app.service('newsManager',function($http){
    let manager =this;
    this.requesting =false;

    this.gotoPage= async function(pageIndex,nPage){
        if(manager.requesting)
            return null;
        manager.requesting = true;
        let data = {
            pageIndex:pageIndex,
            npage:nPage
        };
        return await manager.requestInfo(data);
    };

    this.retrieveSome = async function(count){
       if(manager.requesting)
           return null;
        manager.requesting = true;
       let data = {
           pageIndex:1,
           nPage: count
       };
       return await manager.requestInfo(data);
    };

    this.requestInfo = async function(data){
        manager.requesting = true;
        let response = await $http.post('/getNewsList',data);
        manager.requesting = false;
        if(response)
        {
            let data = JSON.parse(LZString.decompressFromBase64(response.data));
            if(data.status == 500)
            {
                return data;
            }
            else
                throw data.message;
        }
        throw '后端出错啦!';
    }
});

app.service('worksManager',function($http,$rootScope){
    let manager = this;
    this.requesting = false;

    this.requestWorkList = function(data){
        manager.requesting = true;
        let response = $http.post('/getWorksList',data)
            .then(function(response){
                manager.requesting =false;
                let result = response.data;
                $rootScope.$broadcast('worksManagerRequest',response.data);
            })
            .catch(function(err){
                manager.requesting = false;
                $rootScope.$broadcast('worksManagerRequest',{error:err,status:503});
            });
    };
});

app.controller("headControl",function(){
});


app.controller("newsCon",function($scope,$http,$rootScope,$location,newsManager,pageSplitter,$timeout){
    var params = $location.search();
    $scope.pageManager = pageSplitter;
    let pageManager = $scope.pageManager;
    pageManager.reset();
    $scope.requesting = false;
    pageManager.setPageIndex(params.page);

    $scope.newsList = [];
    $scope.pageIndex = [1];
    $scope.error = '';

    $scope.refreshPageUrl = function(){
        var href = $location.url();
        if(href.lastIndexOf('?')!= -1)
        {
            href = href.substring(0,href.indexOf('?'));
        }
        var newUrl =href+'?'+'page='+ pageManager.pageIndex;
        var data = {
            title:"cleeGame"
        };
        window.history.pushState(data,$scope.title,newUrl);
    };

    $scope.refreshPage=function(){
        $scope.onGoPage(pageManager.pageIndex);
    };

    $scope.onGoPage = function(pageIndex){
        if($scope.requesting)
            return;
        $scope.requesting =true;
        let response = newsManager.gotoPage(pageIndex)
            .then(function(response){
                if($rootScope.callBack['NEWS'])
                    $rootScope.callBack['NEWS'].pop();
                if(!response)
                    throw '数据出错啦';
                $scope.error = '';
                $scope.refreshPageUrl();
                pageManager.refreshPageInfo(response.num);
                $scope.newsList = response.contents || [];
                $scope.requesting =false;
                $scope.$apply();
            })
            .catch(function(err){
                $scope.error = err;
                $scope.requesting = false;
                let result = $timeout($scope.refreshPage,5);
                if(!$rootScope.callBack['NEWS'])
                    $rootScope.callBack['NEWS'] = [];
                $rootScope.callBack['NEWS'].push(result);
            });
    };

    $scope.refreshPage();

});


app.controller("downloadsCon",function($scope,$rootScope,$window,$routeParams,$location,pageSplitter,worksManager){
    $scope.pageManager = pageSplitter;
    $scope.requesting = false;
    $scope.index = 1;
    $scope.error='';
    $scope.entryList = [];

    let pm = $scope.pageManager;

    $scope.resetPageManager = function(){
        let currentPage = $routeParams.page || 1;
        let dataPerPage = 8;
        pm.reset(dataPerPage,currentPage);
        pm.unSelectStyle = {
            background:'white',
            color:'rgba(156,147,150,1)',
            border:'rgba(156,147,150,1) 1px solid'
        };

        pm.selectedStyle = {
            background:'lightgray',
            color:'white',
            border:'lightgray 1px solid'
        };
    };

    $scope.resetPageManager();

    $scope.$on('worksManagerRequest',function(event,data){
        $scope.error = '';
        if(data.error)
            $scope.error = data.error;
        if(data.contents.length==0)
        {
            $scope.error = '该页上没有记录';
        }
        $scope.entryList = data.contents;
        $scope.requesting = false;
    });

    $scope.requestInfo = function(dataType){
        if($scope.requesting)
            return;
        var data = {
            dataType: dataType,
            dataPage: pm.pageIndex,
            dataPerPage: pm.entryPerPage
        };
        $scope.requesting = true;
        worksManager.requestWorkList(data);
    };

    $scope.gotoEntry = function(entry){
        switch(entry.type)
        {
            case 2000:
                newUrl ='/works/';
                break;
            case 2005:
                newUrl+='/tools/';
                break;
            case 2010:
                newUrl+='/journal/';
                break;
            case 2015:
                newUrl+='/games/downloads/';
            default:
                newUrl = '';
                break;
        }

        if(newUrl == '')
            return;

        newUrl+=entry._id;
        $window.open(newUrl);
    };


});

app.controller("manualCon",function($scope,$http,$routeParams,$location){
    let params = $location.search();
    $scope.index = params.page || 0;
    $scope.title = '';
    $scope.subIndex = params.chapter || 0;
    $scope.requesting = false;
    $scope.contents = [];
    let firstError = '正在加载中';
    $scope.error = firstError;
    $scope.mainBoardTemplate = 'template'+$scope.index%4;
    $scope.pageColor = '';
    if(!('page' in $location.search()))
    {
        $location.search('page',$scope.index);
    }

    $scope.resetSubIndex = function(){
        $scope.error = firstError;
         $scope.subIndex = 0;
         $location.search('chapter',$scope.subIndex);
    };

    $scope.resetAttribute = function(index,name,color)
    {
        $scope.index = index;
        $scope.title = name;
        $scope.mainBoardTemplate = 'template'+index%4;
        $scope.contents.length = 0;
        $scope.pageColor = color;
        var element = document.getElementById("manualContents");
        if(element)
            element.innerHTML = '';
    };

    $scope.onSubChoose = function(index){
        $scope.subIndex = index;
        $scope.refreshSubPage();
    };

    $scope.$on('$viewContentLoaded',function(){
        if($scope.error == firstError)
            $scope.error = "没有找到该页面，请点击左侧按钮前往相应说明。"
    });

    $scope.refreshSubPage = function(){
        let contents = $scope.contents[$scope.subIndex].contents || "<p>页面显示错误，请刷新。</p>";
        var element = document.getElementById("manualContents");
        if(element)
           element.innerHTML = contents;
    };

    $scope.requestInfo=function(){
        $scope.requesting = true;
        $scope.error = firstError;
        data = {
            title:$scope.title
        };
        $http.post('/getManual',data).then(function(response){
            $scope.requesting = false;
            let result = response.data.contents || [];
            if(result.length == 0)
                throw '当前没有相关说明。请等待更新';
            else
            {
                $scope.error='';
                for(var i=0;i<result.length;++i)
                {
                    result[i].index = i;
                }
                $scope.contents = result;
            }
        }).catch(function(err){
            $scope.requesting = false;
            $scope.error = err;
        });
    };
});


app.controller('guideBarCon',function($scope,newsManager,$timeout){
    $scope.news = [];
    $scope.requesting = false;

    $scope.refresh = function(){
       $scope.getNews();
    };

    $scope.getNews = function(){
        if($scope.requesting)
            return;
        $scope.requesting = true;
        newsManager.retrieveSome(5)
            .then(function(response){
                if(!response)
                    throw 'no response is received';
                $scope.error = '';
                $scope.news = response.contents || [];
                $scope.requesting =false;
                $scope.$apply();
            })
            .catch(function(err){
                $scope.requesting =false;
                $scope.error = '没有获取到新闻，后端出错';
            })
    };

    $scope.getNews();
});