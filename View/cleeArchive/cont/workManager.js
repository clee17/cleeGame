app.service("workManager",function($http,$rootScope){
    this.deletePost = function(data){
        $http.post('/fanfic/post/delete',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let received = JSON.parse(LZString.decompressFromBase64(response.data));
                if(received.msg)
                   $rootScope.$broadcast(received.msg,received);
                else
                    throw '网络通信错误';
            },function(err){
                $rootScope.$broadcast('postDeleteFailed',{success:false,info:err});
            });
    };
});