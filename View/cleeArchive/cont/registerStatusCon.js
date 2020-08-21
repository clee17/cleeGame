app.controller("registerStatusCon",['$scope','$rootScope','$cookies','userManager',function($scope,$rootScope,$cookies,userManager){
    $scope.id = '';
    $scope.requestId = '';
    $scope.requesting = false;
    $scope.status = -1;
    $scope.position = -1;

    $scope.message =[
    ];

    $scope.getStatusText = function(data){
        if(data.registered)
            return '已注册';
        switch(data.result){
            case 0:
                return '申请中';
            case 1:
                return '已通过';
            case 2:
                return '已拒绝';
            case 3:
                return '延后';
            default:
                return '数据库中没有该记录，请重新申请';
        }
    };

    $scope.getStatusExplain = function(data){
        if(data.registered){
            return '您已通过申请并完成注册， 请使用右上角的登陆按钮直接登陆';
        }else{
            switch(data.result){
                case 0:
                    return '审查员正在努力审查，您当前处在<b>第'+data.position+'位</b>';
                case 1:
                    return '您的申请已经通过，请检查邮箱（包括垃圾邮件收件箱），以获取您的注册链接，或直接前往：<a href="/register/'+data.requestId+'">完成注册</a>';
                case 2:
                    return '非常抱歉，您的申请已被拒绝。<br>拒绝原因敬请查阅您的邮箱。';
                case 3:
                    return '非常抱歉，因为资源有限，我们已将您的申请放入等待列表，当资源被释放时我们会在后台第一时间通过您的申请。<br>在此期间请勿重复申请';
                default:
                    return '数据库中没有该记录，请重新申请';
            }
        }
    }

    $scope.requestProceed = function(){
        userManager.getStatus({id:$scope.id});
    };

    $scope.$on('requestStatusFinished',function(event,data){
        $scope.requesting =false;
        console.log(data);
        if(data.success){
            let element = document.getElementById('mainAnswer');
            if(element)
                element.innerHTML = '<div>您的申请当前状态为：<b>'+$scope.getStatusText(data)+'</b></div>'+
                    '<div>'+$scope.getStatusExplain(data)+'</div>';
        }else{
            $scope.$emit('showError',data.message);
        }
    });

   $scope.submitRequest = function(){
       if($scope.id.length === 0){
            $scope.$emit('showError','您的邀请码不能为空');
       } else if(!$scope.id.match(/^[0-9a-fA-F]{24}$/)){
           $scope.$emit('showError','请输入有效的邀请码格式');
       }else{
           if($scope.requesting)
               return;
           $scope.requesting =true;
           $scope.requestProceed();
       }
   };
}]);
