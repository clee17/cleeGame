app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.message = [];
            for(let i=0; i< 5; ++i){
                if(scope['message_'+i])
                    scope.message.push(unescape(scope['message_'+i]));
            }
        }
    }
});

app.controller("introCon",['$scope','$rootScope','$cookies','userManager','countManager',function($scope,$rootScope,$cookies,userManager,countManager){
    $scope.mail = '';
    $scope.existed = false;
    $scope.statements = '';
    $scope.requesting = false;

    $scope.donate = function(){
        $scope.$emit('showExplain',{info:$scope.message[0]});
    };

    $scope.showExplain = function(index){
        $scope.$emit('showExplain',{info:$scope.message[index]});
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
            $scope.mail = '';
            $scope.statements = '';
        }else{
            $scope.$emit('showError',data.message);
            $scope.checkExisted();
        }
        if(data.alertInfo){
            $scope.$emit('showExplain',{info:data.alertInfo});
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

            let works = record['0'] ? record['0'] : 0;
            let paints = record['2'] ? record['1'] :0;
            let games = record['3'] ? record['2'] : 0;
            let all = works + paints + games;
            tempArr[4].innerHTML = all.toString();
            tempArr[5].innerHTML = works ? record['0'] : '??';
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
