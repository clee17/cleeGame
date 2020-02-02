
app.controller("searchCon",function($scope,$rootScope,searchManager){

   $scope.searching = true;
   $scope.showErr = false;
   $scope.err = '';
   $scope.receivedList = [];
   console.log($rootScope.readerId);

   $scope.$on('searchFinished',function(event,data){
      $scope.searching = false;
      if(data.success){
         $scope.receivedList = data.result;
      }
      else{
         $scope.showErr = true;
         $scope.err = data.info;
      }
   });

   searchManager.searchAll({searchType:$rootScope.searchType});

});