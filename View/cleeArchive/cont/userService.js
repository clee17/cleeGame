app.service('userManager',function($http,$rootScope,LZString){
    this.saveSettings = function(data){
        $http.post('/settings/save',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(data.success)
                        $rootScope.$broadcast('settingsSaveFinished',data);
                    else
                        $rootScope.$broadcast('settingsSaveFinished',{message:data.message});
                },
                function(err){
                    $rootScope.$broadcast('settingsSaveFinished',{message:'网络通信错误，请刷新页面尝试'});
                });
    };
});