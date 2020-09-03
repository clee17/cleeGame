app.controller('logInfoCon',function($scope){
    $scope.info = '请先<b>登录</b>以查看您所订阅的文章与作者信息。<br>您可以使用cleeGame的账户登录本站<br>';
});

app.controller('registerInfoCon',function($scope){
    $scope.info = '密码为6-12位任意字符。<br>用户名长度不得超过12位';
});


app.controller('loginCon',function($rootScope,$scope,$window,loginManager){
    $scope.data  = ['',''];
    $scope.error = null;
    $scope.loginMode = 0;

    let countryCode = $rootScope.countryCode || 'OTHER';

    let submitSign = {
        'CN': '登录',
        'EN': 'Login',
        'OTHER':'Login'
    };
    $scope.userResult = '';
    $scope.submitSign = '登录';
    $scope.requesting = false;

    $scope.checkUser = function(){};
    $scope.sendLogin = function(){
        if($scope.requesting)
            return;
        if($scope.data[0].length==0)
            $scope.error = '用户名不能为空!!';
        else if($scope.data[1].length == 0)
            $scope.error = '请输入密码!!';
        else
            $scope.error =null;

        if($scope.error == null)
        {
            $scope.requesting = true;
            let cryptoData = {user:$scope.data[0],pwd:md5($scope.data[1]).toString()};
            loginManager.requestLogin(cryptoData);
        }
    };

    $scope.$on('loginFinished',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $window.location.reload();
        }
        else
            $scope.error = data.message;
    });
});


app.controller('registerCon',function($rootScope,$scope,$window,$location,$rootScope,loginManager){
    let countryCode = $rootScope.countryCode;
    let submitSign = {
        'CN':'注册',
        'EN':'Register',
        'OTHER': 'Register'
    };
    $scope.data  = ['',''];
    $scope.error = null;
    $scope.submitSign = submitSign[countryCode] || 'Register';
    $scope.userChecking = false;
    $scope.requesting = false;
    $scope.loginMode = 1;
    $scope.id = $rootScope.registerId || '';
    $scope.userErr = '';
    $rootScope.intro = LZString.decompressFromBase64($rootScope.intro);

    console.log($rootScope.registerId);
    $scope.checkUser = function(){
        if($scope.userChecking)
            return;
        if($scope.data[0].length  == 0)
        {
            $scope.userErr = '用户名不能为空';
            return;
        }
        $scope.userErr = '';
        $scope.userChecking = true;
        loginManager.checkUserName($scope.data[0]);
    };

    $scope.sendLogin = function(){
        if($scope.requesting)
            return;
        if($scope.data[0].length ==0)
            $scope.error = '用户名不能为空';
        if($scope.data[0].length > 12)
            $scope.error = '用户名长度不能超过12位';
        else if($scope.data[1].length == 0)
            $scope.error = '请输入密码!!';
        else if($scope.data[1].length <6)
            $scope.error ='密码需要最少六位！';
        else if($scope.data[1].length > 12)
            $scope.error ='密码不能超过12位';
        else
            $scope.error =null;

        if($scope.error == null)
        {
            $scope.requesting = true;
            let cryptoData = {_id:$rootScope.registerId||'',user:$scope.data[0],pwd:md5($scope.data[1]).toString(),intro:LZString.compressToBase64($rootScope.intro),mail:$rootScope.mail};
            loginManager.requestRegister(cryptoData);
        }
    };

    $scope.$on('registerFinished',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $scope.result = '注册成功';
            $window.location.href = 'http://'+$location.host();
        }
        else
             $scope.error= data.message;
    });

    $scope.$on('nameCheckFinished',function(event,data){
        $scope.userChecking = false;
        $scope.userErr = data.message;
    });
});


