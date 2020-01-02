app.controller("welcomeCon",function($scope,$http,$rootScope,$window,$location){
    $scope.isLogged = false;
    $scope.initialized = false;

    $scope.channel = 0;

    $scope.error = '';

    $scope.news = [];
    $scope.newsReceived = false;

    $scope.changeChannel = function(newChannel){
        $scope.channel = newChannel;
        switch(newChannel)
        {
            case 0:
            {
                $scope.$broadcast("updateChannel");
                break;
            }
            case 1:
            {
                $scope.$broadcast("updateMessage");
                break;
            }
            case 2:
            {
                $scope.$broadcast("updateComments");
                break;
            }
            case 3:
            {
                $scope.$broadcast("updateBookmark");
                break;
            }
            default:
                break;
        }
    };

    let cookieList = document.cookie.split(';');
    for(var i=0;i<cookieList.length;++i)
    {
        let attr = cookieList[i].substring(0,cookieList[i].indexOf('='));
        let value = cookieList[i].substring(cookieList[i].indexOf('='));
        if(attr == 'userId')
        {
            $scope.isLogged = true;
        }
    }

    if(!$scope.initialized)
        $scope.initialized = true;
});

app.controller("tagUpdateCon",function($scope,$http,$rootScope,$window,$location,feedManager){
    $scope.requesting = false;
    $scope.updated = false;
    $scope.initialized = false;
    $scope.currentTag = '';
    $scope.err = null;

    $scope.list = [];
    $scope.posts = [];

    let updateFeed = function() {
        $scope.err = null;
        $scope.updated = false;

        let data = $scope.currentTag;
        if ($scope.currentTag == '')
            data = $scope.list.join(',');
        if (data == '')
        {
            $scope.updated = true;
            $scope.err = '暂无订阅,请先去订阅相关频道以获取最新文章';
            return;
        }
        feedManager.getPosts(data);
            // .then(function(res){
            //     if(!res)
            //         throw '网络通信错误';
            //     if(res.data.length ==0)
            //         throw '您的订阅中当前没有文章';
            //     $scope.updated = true;
            //     $scope.posts = JSON.parse(JSON.stringify())
            //
            // })
            // .catch(function(err){
            //     $scope.err=err;
            //     $scope.updated = true;
            //     $scope.$apply();
            // })
    };

    let getList = function(){
        if($scope.requesting)
            return;
        $scope.requesting = true;
        feedManager.getFeeds('channel');
    };

    $scope.$on("updateChannel",function(event,data){
         getList();
    });

    $scope.$on('feedsReceived',function(event,response){
        $scope.initialized = true;
        if(response.type=='channel')
        {
            $scope.list = JSON.parse(JSON.stringify(response.data));
            $scope.requesting = false;
            updateFeed();
        }
        else
            $scope.posts = JSON.parse(JSON.stringify(response.data));

    });

    $scope.$on('feedsLost',function(event,err){
        $scope.initialized = true;
        $scope.requesting = false;
        $scope.err=err.message;
    });

    getList();
});
