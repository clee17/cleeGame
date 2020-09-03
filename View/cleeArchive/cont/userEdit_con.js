app.controller("userEditCon",['$scope','$rootScope','loginManager',function($scope,$rootScope,loginManager){
    $scope.requesting = false;
    $scope.pwdCompleted = false;
    $scope.error = [];
    $scope.pwd = '';
    $scope.rpPwd = '';

    $scope.addError = function(msg){
        for(let i=0; i<$scope.error.length;++i){
            if($scope.error[i] === msg)
                return;
        }
        $scope.error.push(msg);
    }

    $scope.removeError = function(msg){
        for(let i=0; i<$scope.error.length;++i){
            if($scope.error[i] === msg){
                $scope.error.splice(i,1);
                return;
            }
        }
    }

    $scope.checkError = function(){
        if($scope.pwd.length >12 || $scope.rpPwd.length > 12)
            $scope.addError('密码长度不能长于12位');
        else
            $scope.removeError('密码长度不能长于12位');
        if($scope.pwd.indexOf(' ')>=0 || $scope.rpPwd.indexOf(' ') >=0 )
            $scope.addError('密码中不能包含空格');
        else
            $scope.removeError('密码中不能包含空格');
        if(md5($scope.pwd) === $rootScope.value)
            $scope.addError('新密码不能与原密码一致');
        else
            $scope.removeError('新密码不能与原密码一致');
        $scope.showError();
        return $scope.error.length ===0;
    };

    $scope.showError  = function(){
        let html = "";
        for(let i=0; i< $scope.error.length;++i){
            html += '<li>'+$scope.error[i]+'</li>';
        }
        let element = document.getElementById('resetPwError');
        if(element){
            element.innerHTML ='<ul>'+html+'</ul>';
            element.style.opacity = $scope.error.length >0 ? '1':'0';
        }

        let btn = document.getElementById('resetPwBtn');
        if(btn)
            btn.disabled = $scope.error.length === 0? null : true;
    }

    $scope.checkPwd = function(){
        if($scope.rpPwd.length >0 && $scope.pwd.length >0 && $scope.rpPwd !== $scope.pwd )
            $scope.addError('您两次输入的密码不一致，请重新输入');
        else
            $scope.removeError('您两次输入的密码不一致，请重新输入');
        if($scope.pwd.length >0 && $scope.pwd.length <6)
            $scope.addError('密码的长度不得少于6位');
        else
            $scope.removeError('密码的长度不得少于6位');
        $scope.showError();
        return $scope.error.length === 0;
    };

    $scope.submitResetPwd = function(){
        if(!$scope.checkError())
            return;
        if(!$scope.checkPwd())
            return;
        $scope.requesting = true;
        loginManager.saveNewPwd({info:md5($scope.pwd),_id:$rootScope.userId,requestId:$rootScope.requestId});
    };

    $scope.$on('pwdSaved',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $scope.pwdCompleted = true;
        }
        else
            $scope.$emit('showError',data.message);
    });
}]);
