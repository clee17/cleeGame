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
        manager.request('/user/login','loginFinished',data);
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

    this.resetPwdUser = function(data){
        manager.request('/user/resetPwdUser','pwdResetFinished',data);
    };

    this.saveNewPwd = function(data){
        manager.request('/user/save/pwd','pwdSaved',data);
    }

});


var __isRole = function(id,settings){
    let role = settings.role;
    let str = "";
    for(let i=1; i<id;++i){
        str = str + '0';
    }
    str = '1'+str;
    str = parseInt(str,2);
    return (str & settings.role)>0;
}

var __isApplicating = function(index,application){
    if(!Array.isArray(application))
        return false;
    for(let i=0; i<application.length;++i){
        if(application[i].type === index)
            return true;
    }
    return false;
};