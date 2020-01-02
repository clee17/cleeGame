app.controller("welcomeCon",function($scope,$http,$rootScope,$window,$location,feedManager){
    $scope.isLogged = false;
    $scope.initialized = false;

    $scope.error = '';


    if(!$scope.initialized)
        $scope.initialized = true;
});