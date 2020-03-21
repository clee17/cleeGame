app.directive('infoReceiver',['$rootScope',function($rootScope){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.liked = Number(scope.liked);
            scope.visitorLiked = Number(scope.visitorLiked);
            scope.bookMarked = Number(scope.bookMarked);
            scope.chapterCommented = Number(scope.chapterCommented);
            scope.commented = Number(scope.commented);
            scope.bookStatus = Number(scope.bookStatus);
            scope.index = scope.index.replace(/\n/gi,'<br>');
            scope.index = JSON.parse(scope.index);
            scope.bookCommentList = scope.bookCommentList.replace(/\n/g,'<br>');
            scope.bookCommentList = JSON.parse(scope.bookCommentList);
			scope.chapterCommentList = scope.chapterCommentList.replace(/\n/g,'<br>');
            scope.chapterCommentList = JSON.parse(scope.chapterCommentList);
            scope.likePostList = JSON.parse(scope.likePostList);
            scope.chapterCount = Number(scope.chapterCount);
            scope.feedback = JSON.parse(scope.feedback);

            $rootScope.x = scope.authorId;
            $rootScope.visitorId=  scope.visitorId;
            $rootScope.readerId = scope.readerId;

            if (scope.feedback) {
                scope.feedback.forEach(function (item) {
                    if (item.type === 1)
                        scope.ifLiked = Boolean(item.status);
                    else if (item.type === 2)
                        scope.ifBookMarked = Boolean(item.status);
                })
            }
        }
    }
}]);

app.directive('feedbackContent',function(){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.$watch(element[0].offsetHeight,function(){
            });
        }
    }
});

app.filter('endClass', function() { //可以注入依赖
    return function(code,bookStatus) {
        if(bookStatus === 0 )
            return "· 全文完 ·";
        else
            return '· 未完待续 ·';
    }
});

app.filter('fullChapter', function() { //可以注入依赖
    return function(chapterCount,index) {
        let publishedIndex = 0;
        index.forEach(function(item){
            if(item.published)
                publishedIndex++;
        });
        return publishedIndex+'/'+chapterCount;
    }
});

app.directive('codeInput',function(){
    return {
        restrict: 'C',
        link:function(scope,element,attr){
            element.val('');

            element
                .on('input',function(){
                    scope.validateError  = '';
                    let val = element.val();
                    if(val === '')
                        scope.codeVal = '';
                    else
                        scope.codeVal = md5(val);

                })
                .on('blur',function(){
                    scope.checkVal();
                })
        }
    }
});

app.controller("feedbackCon",['$scope','$rootScope','$cookies','$http','$timeout','$window','feedbackManager',function($scope,$rootScope,$cookies,$http,$timeout,$window,feedbackManager){
    $scope.showComment = false;
    $scope.showFeedback = false;
    $scope.codeError = '';
    $scope.validateError = '';
    $scope.validating = false;
    $scope.bookStatus = 0;

    $scope.codeVal = '';

    $scope.workId = '';
    $scope.chapterId = '';
    $scope.authorId = '';
    $scope.liked = -1;
    $scope.bookMarked = -1;
    $scope.chapterCommented = -1;
    $scope.commented = -1;
    $scope.visitorLiked = -1;
    $scope.likePostList = [];
    $scope.commentList = [];

    $scope.ifLiked = false;
    $scope.ifBookMarked = false;

    $scope.panelVisible = false;
    $scope.bookVisible = false;
    $scope.indexVisible = false;

    $scope.isRequesting = false;

    let item = document.getElementById('infoScroll');
    item.style.display = 'flex';
    let preloads = [];
    preloads.push(document.getElementById('preLoad1'));
    preloads.forEach(function(item){
        if(item)
            item.style.display = 'none';
    });

    let afterLoads = [];
    afterLoads.push(document.getElementById('preLoad1'));
    afterLoads.forEach(function(item){
        if(item)
            item.style.display = 'inline-block';
    });

    $scope.initializeCommentData = function(){
        $scope.infoType = 0;
        $scope.targetUser = $scope.authorId;
        $scope.commentList = $scope.bookCommentList;
        let btn = document.getElementById('bookCommentBtn');
        let width = btn.offsetLeft - btn.parentElement.offsetLeft + btn.children[0].offsetWidth/2;
        let arrow = document.getElementById('btnPointer');
        if(arrow)
        {
            arrow.style.transform = 'translateX('+width+'px)';
            arrow.style.transition = 'transform 1.5s ease-in-out';
        }
    };

    $scope.showBookComment = function(){
        if($scope.infoType === 0)
            return;
        $scope.infoType = 0;
        $scope.commentList = $scope.bookCommentList;
        adjustPointer($scope.infoType);
    };

    $scope.showChapterComment = function(){
        if($scope.infoType === 1)
            return;
        $scope.infoType = 1;
        $scope.commentList = $scope.chapterCommentList;
        adjustPointer($scope.infoType);
    };

    $scope.showLikeList = function(){
        if($scope.infoType === 2)
            return;
        $scope.infoType = 2;
        let btn = document.getElementById('likeCommentBtn');
        adjustPointer($scope.infoType)
    };

    $scope.updateCommentCount = function(data){
        if ($scope.infoType === 0)
            $scope.commented = data.commentCount;
        else if ($scope.infoType === 1)
            $scope.chapterCommented = data.commentCount;
        adjustPointer($scope.infoType);
    };
    $scope.likeIt = function(){
        let data = {work: $scope.workId, user: $scope.authorId};
        $scope.liked++;
        $scope.ifLiked = !$scope.ifLiked;
        feedbackManager.likeIt(data);
    };

    $scope.nextChapter = function(backward){
        let baseUrl = '/fanfic/';
        let stamp = null;
        let checkStamp = function(index){
            if(stamp != null && index.published)
            {
                baseUrl += index.chapter;
                return true;
            }
            if(index.chapter === $scope.chapterId)
                stamp = $scope.chapterId;
            return false;
        };
        if(backward)
        {
            for(let i = $scope.index.length-1;i>=0;--i)
            {
                if(checkStamp($scope.index[i]))
                    break;
            }

        }
        else{
            let stamp = null;
            for(let i =0;i<$scope.index.length;++i)
            {
                if(checkStamp($scope.index[i]))
                    break;
            }
        }
        return baseUrl;
    };

    $scope.bookMarkIt = function () {
        let data ={work: $scope.workId, user: $scope.authorId};
        feedbackManager.bookMarkIt(data);
    };

    let adjustPointer = function(infoType){
        let btn = null;
        if(infoType === 1)
            btn = document.getElementById('chapterCommentBtn');
        else if(infoType === 0)
            btn = document.getElementById('bookCommentBtn');
        else if(infoType === 2)
            btn = document.getElementById('likeCommentBtn');
        if(btn == null)
            return;
        let width = btn.offsetLeft - btn.parentElement.offsetLeft + btn.children[0].offsetWidth/2;
        let arrow = document.getElementById('btnPointer');
        if(arrow)
        {
            arrow.style.transform = 'translateX('+width+'px)';
            arrow.style.transition = 'transform 0.8s ease-in-out';
        }
    };

    $scope.updateFeedBackData = function (data) {
        if($scope.infoType === 2)
            $timeout(adjustPointer($scope.infoType),100);

        if (!data.user)
            return;
        let newData = {type: data.type, userName: data.userName, user: data.user, status: data.status};

        let step = data.status == 1 ? 1 : -1;
        let index = -1;
        for (let i = 0; i < $scope.likePostList.length; ++i) {
            if ($scope.likePostList[i].user === data.user && $scope.likePostList[i].type === data.type)
                index = i;
        }

        let result = Boolean(data.status);
        if (result && index < 0)
            $scope.likePostList.push(newData);
        else if (!result && index >= 0)
            $scope.likePostList.splice(index, 1);

    };

    $scope.$on('showError',function(event,data){
        $scope.showError = true;
        $scope.$broadcast('showErrorText',data);
    });



    $scope.$on('likeFinished', function (event, data) {
        if ($scope.workId !== data.work)
            return;
        if (data.success) {
            $scope.liked = data.liked;
            $scope.visitorLiked = data.visitorLiked;
            $scope.ifLiked = Boolean(data.status);
            $scope.updateFeedBackData(data);
            adjustPointer($scope.infoType);
        }
        else{
            $rootScope.$broadcast('showErrorText',data.message);
        }
    });

    $scope.$on('bookmarkFinished', function (event, data) {
        if ($scope.workId !== data.work)
            return;
        if (data.success) {
            $scope.bookMarked = data.bookmarked;
            $scope.ifBookMarked = data.status;
            $scope.updateFeedBackData(data);
            adjustPointer($scope.infoType);
        }
        else
        {
            $rootScope.$broadcast('showErrorText',data.message);
        }
    });

    $scope.switchButton = function(btn,on){
        btn.style.background = on?'rgba(158,142,166,255)':'white';
        btn.style.color = on?'white':'rgba(158,142,166,255)';
        btn.style.pointerEvents = on?'auto':'none';
    };


    $scope.showBook = function(){
        $scope.indexVisible = false;
        $scope.bookVisible = true;
        $scope.panelVisible = true;
    };

    $scope.showIndex = function(){
        $scope.bookVisible = false;
        $scope.indexVisible = true;
        $scope.panelVisible = true;
    };


    $scope.closeInfoPanel = function(){
        $scope.panelVisible = false;
    };

    $scope.isEnd = function(){
        let endIndex = $scope.index[0].chapter;
        for(let i=0; i<$scope.index.length;++i)
        {
            if($scope.index[i].published)
                endIndex = $scope.index[i].chapter;
        }
        return $scope.chapterId === endIndex;
    };

    $scope.checkVal = function(){
        if($scope.codeVal === '')
            $scope.codeError = '口令密码不能为空';
        else if($scope.codeVal.match(/s+/))
            $scope.codeError = '口令密码不能包括空格';
        else
            $scope.codeError = '';
    };


    $scope.submitCode = function(){
        $scope.checkVal();
        if($scope.codeError !== '')
            return;
        $scope.validateError = '';
        let request = {code:$scope.codeVal,type:0};
        $scope.validating = true;
        $http.post('/fanfic/validate/'+$scope.chapterId,{data:JSON.stringify(request)})
            .then(function(response){
                $scope.validating = false;
                let data = response.data;
                if(data.success)
                {
                    let expireDate = new Date();
                    expireDate.setDate(expireDate.getDate() + 300);
                    $cookies.putObject($scope.chapterId,data.code);
                    $window.location.reload();
                }
                else{
                    $scope.validateError = '您输入的口令错误，请重新输入';
                    if($cookies.getObject($scope.chapterId))
                        $cookies.remove($scope.chapterId);
                }
            },function(err){
                $scope.validating = false;
                $scope.validateError = '网络通信错误,请重新尝试';
            });

    };

    let initialize = function(){
        feedbackManager.requestFeedback({work:$scope.workId,chapter:$scope.chapterId});
    }
}]);