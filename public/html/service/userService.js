app.service('loginManager',function($http,$rootScope){
    let manager = this;
    this.request = function(site,info,data,ifInfoReceived){
        $http.post(site,{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(ifInfoReceived)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(info,receivedData);
                },
                function(err){
                    $rootScope.$broadcast(info,{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.requestLogin = function(data){
        manager.request('/user/logout','loginFinished',data);
    };

    this.requestRegister = function(data){
        manager.request('/user/register','registerFinished',data);
    };

    this.requestLogout = function(){
        manager.request('/user/logout','logoutFinished',{});
    };

    this.checkUserName = function(data){
        manager.request('/user/checkUsername','nameCheckFinished',data);
    };

    this.resetPwd = function(data){
        manager.request('/user/resetPwd','pwdResetFinished',data);
    };

    this.saveNewPwd = function(data){
        manager.request('/user/save/pwd','pwdSaved',data);
    }

});