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
                return '延后';
            case 3:
                return '已拒绝';
            default:
                return '数据库中没有该记录，请重新申请';
        }
    };

    $scope.getStatusExplain = function(data){
        if(data.registered){
            return '您的申请已经通过，请检查邮箱（包括垃圾邮件收件箱），以获取您的注册链接，或直接前往：<a href="/register/'+data.requestId+'">完成注册</a>';
        }else{
            switch(data.result){
                case 0:
                    return '审查员正在努力审查，您当前处在<b>第'+data.position+'位</b>';
                case 1:
                    return '您的申请已经通过，请检查邮箱（包括垃圾邮件收件箱），以获取您的注册链接，或直接前往：<a href="/register/'+$scope.requestId+'">完成注册</a>';
                case 2:
                    return '非常抱歉，因为本站的资金有限，所以暂时无法容纳更多用户，如果资金足够，我们会第一时间通过您的申请';
                case 3:
                    return '您已经完成本站的注册，祝创作愉快';
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
