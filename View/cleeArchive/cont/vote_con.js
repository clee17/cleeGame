app.directive('infoReceiver',function($rootScope){
    return {
        restrict: 'E',
        link:function(scope,element,attr){
            scope.options = JSON.parse(unescape(scope.options));
            scope.result = new Array(scope.options.length);
        }
    }
});

app.directive('voteTime',function($rootScope,$filter){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            let str = element.html();
            str = str.replace(/%s/g,$filter('dateInfo')($rootScope.start,0));
            str = str.replace(/%e/g,$filter('dateInfo')($rootScope.end,0));
            element.html(str);
        }
    }
});

app.directive('voteBar',function(){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            let count = scope.option.count;
            let options  = scope.$parent.options;
            let countAll = 0;
            for(let i=0; i<options.length;++i){
                countAll += options[i].count;
            }

            let percent =Math.round((count / countAll)*100);
            percent = percent + "%";
            if(count === 0)
                percent = "0";

            element.css('width',percent);

        }
    }
});

app.directive('votePercent',function(){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            let count = scope.option.count;
            let options  = scope.$parent.options;
            let countAll = 0;
            for(let i=0; i<options.length;++i){
                countAll += options[i].count;
            }

            let percent = Math.round((count / countAll)*100);
            percent = percent + "%";
            if(count === 0)
                percent = "0%";

            element.html("<div style='display:flex;flex-direction:column;height:2rem;'><div style='height:0.9rem;text-align:center;'>"+percent+"</div><div style='font-size:0.8rem;height:1.2rem;font-weight:normal;line-height:1.2rem;color:gray;font-weight:bold;'>"+count+" votes</div></div>");
            element.css('letter-spacing','0');
        }
    }
});

app.directive('voteOptionCount',function($rootScope){
    return {
        restrict: 'A',
        scope:{

        },
        link:function(scope,element,attr){
           scope.html = element.html();
           if(scope.initialized)
               return;
            let middleIndex = scope.html.indexOf("%next");
           if($rootScope.maxOption <0){
               scope.html = scope.html.substring(0,middleIndex);
           }else{
               scope.html = scope.html.substring(middleIndex+5);
               scope.html = scope.html.replace(/%s/g,$rootScope.maxOption);
           }
           element.html(scope.html);
           scope.initialized = true;
        }
    }
});


app.filter('voteOption',function($rootScope){
    return function(input) {
        // filter
        return unescape(input);
    };
});

app.controller("voteCon",['$scope','$rootScope','$cookies','$window','voteManager',function($scope,$rootScope,$cookies,$window,voteManager){
    $scope.completed = false;
    $scope.requesting = false;
    $rootScope.title = unescape($rootScope.title);
    $rootScope.description = unescape($rootScope.description);

    $scope.checkComplete = function(){
        let elements = document.getElementsByClassName('selection');
        let selected = [];
        for(let i=0;i<elements.length;++i){
            if(elements[i].checked)
                selected.push(elements[i].value);
        }
        $scope.completed = selected.length >=1;
        $scope.limitReached = selected.length >= $rootScope.maxOption && $rootScope.maxOption > 0;
        for(let i=0;i<elements.length;++i){
            elements[i].disabled = null;
            if(!elements[i].checked && $scope.limitReached)
                elements[i].disabled = true;
        }
    };

    $scope.submit = function(){
        $scope.requesting = true;
        let elements = document.getElementsByClassName('selection');
        let selected = [];
        for(let i=0;i<elements.length;++i){
            if(elements[i].checked)
                selected.push({_id:elements[i].value});
        }
        voteManager.submitResult({result:selected,_id:$rootScope._id});
    };

    $scope.$on('votes Save Finished',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $cookies.putObject($rootScope._id, 'voted');
            $window.location.reload();
        }else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.checkOption = function(event){
        let target = event.target;
        if(target.checked && target.checkFalse){
            target.checked = false;
            target.checkFalse = false;
        }
        else if(target.checked){
            target.checkFalse = true;
        }

        $scope.checkComplete();
    };
    $scope.initialize();

}]);
