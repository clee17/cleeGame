app.controller("voteCon",['$scope','$rootScope','$cookies','userManager','countManager',function($scope,$rootScope,$cookies,userManager,countManager){
    $scope.initialize = function(){
        if($scope.initialized)
            return;
    };

    $scope.initialize();

}]);
