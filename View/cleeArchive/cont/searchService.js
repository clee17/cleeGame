app.service('searchManager',function($http,$rootScope,LZString){
    this.searchAll = function(data){
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
    };
});