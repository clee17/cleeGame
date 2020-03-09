app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.gradeTemplate = JSON.parse(scope.gradeTemplate);
            scope.followInfo = '<i class="fa fa-plus" style="margin-right:0.5rem;"></i>' + scope.followInfo;
            scope.followedInfo = '<i class="fa fa-minus" style="margin-right:0.5rem;"></i>' + scope.followedInfo;
            scope.refreshBtn();
            scope.initialize();
         }
    }
});

app.controller("tagCon",['$scope','$rootScope','$location','tagManager','userManager',function($scope,$rootScope,$location,tagManager,userManager){
    $scope.requesting = true;
    $scope.data = [];
    let queryStr = $location.search();
    $scope.pageIndex = queryStr.pid? Number(queryStr.pid) : 1;
    $scope.perPage = 15;
    $scope.following = false;


    $scope.refreshBtn = function(){
        let followBtn = document.getElementById('btnFollow');
        let noUserSign = document.getElementById('cannotFollow');
        if(followBtn && $scope.userExisted){
            followBtn.style.display = 'block';
            followBtn.style.background = $scope.followed ? 'lightgray' : null;
            followBtn.style.padding = '3px';
            followBtn.style.boxShadow = 'none';
            followBtn.innerHTML = $scope.followed? $scope.followedInfo : $scope.followInfo;
        }
        else if(noUserSign){
            noUserSign.style.display = 'block';
            noUserSign.innerHTML = $scope.noUserInfo || '';
        }
    };


    $scope.initialize = function(){
        if($scope._initialized)
            return;
        $scope.intialized = true;
        $scope.requesting = true;
        tagManager.requestTagFeed({pageId:$scope.pageIndex,perPage:$scope.perPage,tagId:$scope.tagId});
    };

    $scope.follow = function(){
        if($scope.following)
            return;
        $scope.following = true;
        $scope.followed = !$scope.followed;
        $scope.refreshBtn();
        userManager.follow({type:0,target:$scope.tagId,userId:$rootScope.readerId,status:$scope.followed});
    };

    $scope.$on('tagDataReceived',function(event,data){
        $scope.$broadcast('pageChangeFinished',null);
        $scope.requesting = false;
        if(data.success){
            $scope.ready = true;
            $scope.data = data.result;
        }else{
            let errBoard = document.getElementById('errBoard');
            if(errBoard)
                errBoard.innerHTML = data.message;
        }
    });

    $scope.$on('followFinished',function(event,data){
        $scope.following = false;
        if(data.success){
            $scope.followed = data.result.status;
        }else{
            $scope.followed = !$scope.followed;
            $scope.refreshBtn();
            $scope.$emit('showError',data.message);
        }
    });

    $scope.$on('pageChange',function(event,data){
        $scope.pageIndex = data.pid;
        $scope.requesting = true;
        tagManager.requestTagFeed({pageId:data.pid,perPage:$scope.perPage,tagId:$scope.tagId});
    });
}]);
