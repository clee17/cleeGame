app.service('feedbackManager',function($http,$rootScope){
    this.likeIt = function(postData){
        $http.post('/fanfic/post/like',{data:LZString.compressToBase64(JSON.stringify(postData))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    $rootScope.$broadcast('likeFinished',data);
                },
                function(err){
                    let data = {message:'网络通信错误，请刷新页面尝试',success:false};
                    data.work = postData.work;
                    $rootScope.$broadcast('bookmarkFinished',data);
                });
    };

    this.bookMarkIt = function(postData){
        $http.post('fanfic/post/bookmark',{data:LZString.compressToBase64(JSON.stringify(postData))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                     data.work = postData.work;
                     $rootScope.$broadcast('bookmarkFinished',data);
                },
                function(err){
                    let data = {message:'网络通信错误，请刷新页面尝试',success:false};
                    data.work = postData.work;
                    $rootScope.$broadcast('bookmarkFinished',data);
                });
    };

    this.postComment = function(postData)
    {
        $http.post('/fanfic/post/comment',{data:LZString.compressToBase64(JSON.stringify(postData))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    data.work = postData.workId;
                    data.chapter = postData.chapterId;
                    data.infoType = postData.infoType;
                    $rootScope.$broadcast('commentFinished',data);
                },
                function(err){
                   let data = {message:'网络通信错误，请刷新页面尝试',success:false};
                    data.work = postData.workId;
                    data.chapter = postData.chapterId;
                    data.infoType = postData.infoType;
                    $rootScope.$broadcast('commentFinished',data);
                });
    };

    this.deleteComment = function(postData)
    {
        $http.post('/fanfic/post/deleteComment',{data:LZString.compressToBase64(JSON.stringify(postData))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    data.work = postData.work;
                    data.chapter = postData.chapter;
                    data.infoType = postData.infoType;
                    $rootScope.$broadcast('deleteCommentFinished',data);
                },
                function(err){
                    let data = {message:'网络通信错误，请刷新页面尝试',success:false};
                    data.work = postData.work;
                    data.chapter = postData.chapter;
                    data.infoType = postData.infoType;
                    $rootScope.$broadcast('deleteCommentFinished',data);
                });
    };


    this.requestFeedback = function(data){
        $http.post('/feedback/request',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                     $rootScope.$broadcast('feedbackRequestFinished',data);
                },
                function(err){
                    $rootScope.$broadcast('feedbackRequestFinished',{message:'网络通信错误，请刷新页面尝试',success:false});
                });
    };


});