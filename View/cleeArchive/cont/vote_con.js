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

app.controller("voteCon",['$scope','$rootScope','$cookies','voteManager',function($scope,$rootScope,$cookies,voteManager){

    $scope.initialize = function(){
        if($scope.initialized)
            return;
    };

    $scope.initialize();

}]);
