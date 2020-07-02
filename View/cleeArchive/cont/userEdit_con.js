app.controller("userEditCon",['$scope','$rootScope','loginManager',function($scope,$rootScope,loginManager){
    $scope.requesting = false;
    $scope.error = '';
    $scope.pwd = '';
    $scope.rpPwd = '';

    $scope.checkError = function(){
        $scope.error = '';
        if($scope.pwd !== '' && $scope.rpPwd !== '' && $scope.pwd !== $scope.rpPwd)
            $scope.error = '您两次输入的密码不一致,请重新输入';
        let element = document.getElementById('resetPwError');
        if(element)
            element.innerHTML = $scope.error;
        let btn = document.getElementById('resetPwBtn');
        if(btn)
            btn.disabled = $scope.error === ''? null : true;
    };

    $scope.checkPwd = function(){
        let element = document.getElementById('pwd');
        if(element && element.value !== '')
            $scope.pwd = md5(element.value);
        $scope.checkError();
    };

    $scope.checkRpPwd = function(){
        let element = document.getElementById('pwd2');
        if(element && element.value !== '')
            $scope.rpPwd = md5(element.value);
        $scope.checkError();
    };

    $scope.submitResetPwd = function(){
        if($scope.pwd === '')
            $scope.$emit('showError','您重新设置的密码不能为空');
        else if($scope.rpPwd === '')
            $scope.$emit('showError','请反复确认您的密码');
        else if($scope.pwd !== $scope.rpPwd)
            $scope.$emit('showError','您两次输入的密码不一致');
        else{
            $scope.requesting = true;
            loginManager.saveNewPwd({info:$scope.pwd,_id:$rootScope.userId,requestId:$rootScope.requestId});
        }

    };

    $scope.$on('pwdSaved',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $scope.$emit('showExplain',{info:'<p>密码重设完成，请使用右上角登录按钮进行登录</p>'});
            let btn = document.getElementById('resetPwBtn');
            if(btn)
                btn.disabled = true;
        }
        else
            $scope.$emit('showError',data.message);
    })
}]);
