
app.controller("searchCon",['$scope','$rootScope','$timeout','searchManager','fanficManager',function($scope,$rootScope,$timeout,searchManager,fanficManager){

   $scope.searching = true;
   $scope.showErr = false;
   $scope.err = '';
   $scope.receivedList = [];

   $scope.deleteList = [];

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


   $scope.$on('deleteReceivedList',function(event,data){
      if($scope.deletingPost)
      {
         $scope.$emit('showError', '您删除得太快了，请稍候再操作');
         return;
      }
      for(let i=0;i<$scope.receivedList.length;++i)
      {
         if(i >= $scope.receivedList.length)
            break;
         let item = $scope.receivedList[i];
         if(item.infoType == data.infoType && item.chapter._id == data.index.chapter)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
         }
         else if(data.infoType === 0 && item.work._id == data.index.work)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
         }
         else if(data.infoType === 1 && data.index.prev == null && item.work._id == data.index.work && item.work.chapterCount <= 1)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
            data.infoType = 0;
         }
         if(data.infoType === 1 && item.work._id == data.index.work)
         {
            item.work.chapterCount --;
         }
      }
      $scope.deletingPost = true;
      fanficManager.removePost(data);
   });

   $scope.$on('postRemoved',function(event,data){
           $scope.deletingPost = false;
           if(data.success)
           {
              $scope.deleteList = [];
           }
           else{
              for(let i = $scope.deleteList.length; i>=0; --i)
              {
                 $scope.receivedList.splice($scope.deleteList[i].index,0,$scope.deleteList[i].item);
              }
           }
   });

   searchManager.searchAll({searchType:$rootScope.searchType});
}]);