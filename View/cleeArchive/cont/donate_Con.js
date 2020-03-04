app.controller("donateCon",['$scope','$rootScope','$cookies','userManager',function($scope,$rootScope,$cookies,userManager){
    $scope.disableRequest = function(){
        let element = document.getElementById('billBtn');
        if(element){
            element.disabled = true;
            element.nextElementSibling.style.display = 'block';
        }
    };

    if($cookies.getObject('billRequested')){
        $scope.disableRequest();
    }


    $scope.requestBill = function() {
        if ($scope.billRequested)
            return;
        let element = document.getElementById('billBtn');
        if (element) {
            element.disabled = true;
            $scope.billRequested = true;
            userManager.requestBill({type: 2});
        }
    };

    $scope.$on('requestBillFinished',function(event,data){
        if(data.success){
            $scope.disableRequest();
            if(data.message != '')
                $scope.$emit('showError',data.message);
        }
        else
            $scope.$emit('showError',data.message);
    });

    if($rootScope.noUser){
        let element = document.getElementById('billBtn');
        if(element){
            element.style.display = 'none';
            element.nextElementSibling.style.display = 'none';
        }
    }
}]);