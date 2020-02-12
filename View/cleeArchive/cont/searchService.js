app.service('searchManager',function($http,$rootScope){
    this.searchAllFanfic = function(data){
        data.minInfoType = 0;
        data.maxInfoType = 10;
        $http.post('/search/all',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    $rootScope.$broadcast(data.message,data);
                },
                function(err){
                    $rootScope.$broadcast('searchFinished',{message:'搜索因网络通信错误失败，请重新尝试'});
                });
    };

    this.requestCount = function(data){
        $http.post('/search/all',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(!data)
                        throw '没有收到后端返回的信息';
                    $rootScope.$broadcast(data.message,data);
                },
                function(err){
                    $rootScope.$broadcast('requestFailed',{info:'搜索失败，请重新尝试'});
                });
    }
});