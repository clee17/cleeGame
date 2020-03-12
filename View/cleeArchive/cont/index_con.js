app.controller("welcomeCon",['$scope','$rootScope','$window','$location','tagManager','userManager',function($scope,$rootScope,$window,$location,tagManager,userManager){
    $scope.channel = 0;
    $scope.followError = '';
    $scope.updateList = [];
    $scope.tags = [];
    $scope.loadSign = '1111';
    $scope.tagRequesting = true;
    $scope.requesting = true;

    $scope.updateLoadSign = function(index,condition){
        let info = condition? '1' :'0';
        $scope.loadSign[index] = info;
    };

    $scope.changeChannel = function(newChannel){
        $scope.channel = newChannel;
        switch(newChannel)
        {
            case 0:
            {
                $scope.updateLoadSign(3,true);
                $scope.goUpdatePage();
                break;
            }
            case 1:
            {
                $scope.updateLoadSign(2,true);
                $scope.goUpdateMail();
                break;
            }
            case 2:
            {
                $scope.updateLoadSign(1,true);
                $scope.goUpdateNotification();
                break;
            }
            case 3:
            {
                $scope.updateLoadSign(0,true);
                $scope.goUpdateBookmark();
                break;
            }
            default:
                break;
        }
    };

    $scope.calcChange = function(item){
        let ifUpdates = !!($rootScope.preference >>0 &1);
        let  result = '';
        if(ifUpdates)
            result =  item.target.totalNum - item.saved.total;
        else
            result = item.target.workNum - item.saved.work;

        if(result > 0 )
            result = result.toString();
        else
            result = '';

        return  result;
    };

    $scope.goUpdatePage=  function(){
    };

    $scope.goUpdateMail = function(){

    };

    $scope.goUpdateNotification = function(){

    };

    $scope.goUpdateBookmark = function(){

    };

    $scope.showTagError = function(err){
        let element = document.getElementById('tagFollowedErr');
        if(element)
            element.innerHTML = err;
    };

    $scope.$on('followedTagFinished',function(event,data){
        $scope.tagRequesting = false;
        if(data.success){
            $scope.tags = JSON.parse(JSON.stringify(data.result));
            if($scope.tags.length == 0)
                $scope.showTagError(data.message);
        }
        else
            $scope.showTagError(data.message);
    });

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        $scope.initialize = true;
        tagManager.requestTagPersonalFeed();
        userManager.requestTagFollowed();
    };

    $scope.initialize();
}]);