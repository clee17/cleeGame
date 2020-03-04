app.controller("introCon",['$scope','$rootScope','$cookies','userManager','countManager',function($scope,$rootScope,$cookies,userManager,countManager){
    $scope.message = [
        '<p>本站暂时不接受不记名捐赠，您至少需要通过下方的注册申请栏完成预申请，才能够对本站进行捐赠。</p>'+
        '<p>捐赠不是强制的，捐赠也并不会对申请过程造成加速，所以希望大家不要为了获得账户而浪费自己的收入。</p>'+
        '<p>如果您已经是会员了，那么您可以在您的个人用户名下的下拉框里，点击捐赠页面，进入捐赠信息页</p>'+
        '<p>如果您还没有获得会员许可，则可以通过<a href="/registerProcess">+click+</a>界面查看您的申请进度并进行捐赠。'+
        '<p>不管身处世界的哪个角落，都祝大家创作愉快。</p>',
        '<h1><span>文章创作权限</span></h1>' +
        '<p>该功能已开放完成，会基于网站资金能够承受的范围内永久免费提供给需要使用的作者使用。</p>'+
        '<p>如果您需要使用该权限，可以直接于网站下方申请</p>',
        '<h1> <span>艺术家权限</span></h1>' +
        '<p>该功能尚在开发集资中，如果您有任何建议与兴趣，可以发送邮件到<a href="mailto:cleegame@outlook.com">点击</a>邮箱向我和相关管理员提出建议。</p>' +
        '<p>我们会努力阅读并考虑每一条建议</p>' +
        '<p>祝生活与创作愉快</p>'
    ];

    $scope.mail = '';
    $scope.existed = false;
    $scope.statements = '';
    $scope.requesting = false;

    $scope.donate = function(){
        $scope.$emit('showExplain',$scope.message[0]);
    };

    $scope.showExplain = function(index){
        $scope.$emit('showExplain',$scope.message[index]);
    }

    $scope.checkExisted = function(){
        if($cookies.getObject($scope.mail.toLowerCase())){
            $scope.existed = true;
        }else{
            $scope.existed = false;
        }
        let existedSign = document.getElementById('existedSign');
        if(existedSign)
            existedSign.style.display =$scope.existed? 'block' :'none';
    };

    $scope.$watch('mail',function(){
        if($scope.mail.match(/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/))
            $scope.checkExisted();
        else{
            $scope.existed = false;
            let existedSign = document.getElementById('mailExisted');
            if(existedSign)
                existedSign.style.display ='none';
        }
    });

    $scope.$on('requestRegisterFinished',function(err,data){
        $scope.requesting = false;
        if(data.success){
            $scope.$emit('showExplain','<h1>注册成功！</h1>'+
                '<p>您的邮箱与陈述已经成功被递交到审核队列中，审理通过后您将收到一封包含有注册链接邮件，可以通过链接完成注册。</p>'+
            '<p>您也可以通过网站的审核查询界面使用邮箱查询审核进度<a href="/registerProcess">前往</a></p>'+
            '<p>管理员每天晚上检查一次申请队列，因此您可以第二天早上确认您的申请状态</p>'+
            '<p>祝创作愉快</p>');
            $scope.mail = '';
            $scope.statements = '';
        }else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.submitApplication = function(){
        if($scope.mail.length === 0)
            $scope.$emit('showError','您的邮箱不能为空');
        else if(!$scope.mail.match(/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/))
            $scope.$emit('showError','您必须输入有效的邮箱地址');
        else if($scope.statements.length <=15)
            $scope.$emit('showError','您输入的陈述必须填满15字');
        else{
            $scope.requesting = true;
            userManager.submitRegisterRequest({mail:$scope.mail,statements:$scope.statements});
        }
    };

    $scope.requestCountMap = function(){
        countManager.all();
    };

    $scope.$on('requestAllCountFinished',function(event,data){
        let children = document.getElementsByClassName('unknown');
        let tempArr = [];
        for(let i=0; i<children.length;++i){
           tempArr.push(children[i]);
        };
        tempArr.forEach(function(item,i){
             item.className = 'known';
        });

        if(data.success){
            let record = {};
            for(let i=0; i<data.result.length;++i){
                record[data.result[i].infoType.toString()] = data.result[i].number;
            }

            tempArr[0].innerHTML = record['100'] ? record['100'] : '??';
            tempArr[1].innerHTML = record['101'] ? record['101'] : '??';
            tempArr[2].innerHTML = record['102'] ? record['102'] : '0' ;
            tempArr[3].innerHTML = record['103'] ? record['103'] : '0';

            tempArr[4].innerHTML = record['99'] ? record['99'] :'??';
            tempArr[5].innerHTML = record['0'] ? record['0'] : '??';
            tempArr[6].innerHTML = record['2'] ? record['2'] :'0';
            tempArr[7].innerHTML = record['3'] ? record['3'] :'0';
        }
        else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        $scope.requestCountMap();
    };

    $scope.initialize();

}]);
