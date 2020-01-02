app.service('feedManager',function($http,$rootScope,LZString){
    this.getFeeds = function(type){
        $http.post('/feeds/'+type,{})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.code == 500)
                    $rootScope.$broadcast('feedsReceived',{type:type,data:data.data});
                else
                    $rootScope.$broadcast('feedsLost',{type:type,message:data.message});
            },function(err){
                  $rootScope.$broadcast('feedsLost',{type:type,message:'网络通信错误'});
            });
    };

    this.getPosts = function(data){

    }
});