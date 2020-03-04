app.controller("registerStatusCon",['$scope','$rootScope','$cookies','userManager',function($scope,$rootScope,$cookies,userManager){
    $scope.requestId = '';
    $scope.requesting = false;
    $scope.status = -1;
    $scope.position = -1;

    $scope.message =[
    ];


    $scope.getStatusText = function(){
        switch($scope.status){
            case 0:
                return '申请中';
            case 1:
                return '已通过';
            case 2:
                return '被拒绝';
            case 3:
                return '已注册';
            default:
                return '数据库中没有该记录，请重新申请';
        }
    };

    $scope.getStatusExplain = function(){
        switch($scope.status){
            case 0:
                return '审查员正在努力审查，您当前处在<b>第'+$scope.position+'位</b>';
            case 1:
                return '您的申请已经通过，请检查邮箱（包括垃圾邮件收件箱），以获取您的注册链接。';
            case 2:
                return '非常抱歉，因为本站的资金有限，所以暂时无法容纳更多用户，如果资金足够，我们会第一时间通过您的申请';
            case 3:
                return '您已经完成本站的注册，祝创作愉快';
            default:
                return '数据库中没有该记录，请重新申请';
        }
    }

    $scope.requestProceed = function(){
        userManager.getStatus({_id:$scope.requestId});
    };

    $scope.$on('requestStatusFinished',function(event,data){
        $scope.requesting =false;
        if(data.success){
            $scope.status = data.result;
            $scope.position = data.subType;
            let element = document.getElementById('mainAnswer');
            if(element)
                element.innerHTML = '<div>您的申请当前状态为：<b>'+$scope.getStatusText()+'</b></div>'+
                    '<div>'+$scope.getStatusExplain()+'</div>'+
                '<div style="margin-top:2rem;">如果您对此有兴趣，现在您可以凭借您的申请码前往<a href="/visitorDonate?id='+$scope.requestId+'">捐赠</a>页面查阅捐赠相关细则</div>';
        }else{
            $scope.$emit('showError',data.message);
        }
    });

   $scope.submitRequest = function(){
       console.log('submitRequest');
       if($scope.requestId.length === 0){
            $scope.$emit('showError','您的申请码不能为空');
       } else if(!$scope.requestId.match(/^[0-9a-fA-F]{24}$/)){
           $scope.$emit('showError','请输入有效的申请码');
       }else{
           if($scope.requesting)
               return;
           $scope.requesting =true;
           $scope.requestProceed();
       }
   };

}]);
