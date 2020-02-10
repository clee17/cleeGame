
app.controller("searchCon",function($scope,$rootScope,$timeout,searchManager){

   $scope.searching = true;
   $scope.showErr = false;
   $scope.err = '';
   $scope.receivedList = [];

   let resetHeight = function(){
      let main = document.getElementById('main');
      let sl = document.getElementById('searchList');
      if(main.offsetHeight < sl.scrollHeight)
      {
         main.style.minHeight = sl.scrollHeight+'px';
      }
   };

   $scope.$on('searchFinished',function(event,data){
      $scope.searching = false;
      if(data.success){
         $scope.receivedList = data.result;
         $timeout(resetHeight,100);
      }
      else{
         $scope.showErr = true;
         $scope.err = data.info;
      }
   });

   searchManager.searchAll({searchType:$rootScope.searchType});



});