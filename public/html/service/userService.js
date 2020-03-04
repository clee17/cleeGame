app.service('loginManager',function($http,$rootScope){
    this.requestLogin = function(data){
        $http.post('/user/login',data)
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data && data.success)
                    $rootScope.$broadcast('loginSuccess',data);
                else
                    $rootScope.$broadcast('loginFailed',{message:'登录失败'});
            },
            function(err){
                console.log(err);
                $rootScope.$broadcast('loginFailed',{message:'网络通信错误，请刷新页面尝试'});
            });
    };

    this.requestLogout = function(){
        $http.post('/user/logout',null)
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    $rootScope.$broadcast('logoutFinished',data);
                },
                function(err){
                    $rootScope.$broadcast('logoutFinished',{message:'网络通信错误，请刷新页面尝试',success:false});
                });
    };

    this.requestRegister = function(data){
        $http.post('/user/register',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(data.success)
                        $rootScope.$broadcast('registerSuccess',data);
                    else
                        $rootScope.$broadcast('registerFailed',data);
                },
                function(err){
                    $rootScope.$broadcast('registerFailed',{message:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.checkUserName = function(data){
        $http.post('/user/checkUsername',{data:LZString.compressToBase64(data)})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    $rootScope.$broadcast('nameCheckFinished',data);
                },
                function(err){
                    console.log(err);
                    $rootScope.$broadcast('nameCheckFinished',{message:'网络通信错误，请刷新页面尝试'});
                });
    };

});