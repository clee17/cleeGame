app.controller("searchCon",['$scope','$rootScope','$timeout','$location','searchManager','fanficManager',function($scope,$rootScope,$timeout,$location,searchManager,fanficManager){
   $scope.searching = false;
   $scope.showErr = false;
   $scope.err = '';
   $scope.receivedList = [];
   $scope.deleteList = [];
   $scope.listNumber = 0;

   let searchQuery  = $location.search();
   $scope.pageId = Number(searchQuery.pid) || 1;

   let excludeList = [5];
   $rootScope.countList.forEach(function(list){
      if(list.infoType===5 && $rootScope.searchList.indexOf(1) !== -1)
          $scope.listNumber -= list.number;
      $rootScope.searchList.forEach(function(infoType){
         if(list.infoType === infoType && excludeList.indexOf(infoType) === -1)
               $scope.listNumber += list.number;
      })
   });

   if(typeof $scope.pageId !== 'number' || $scope.pageId>Math.ceil($scope.listNumber/$scope.perPage))
   {
      $scope.err = '不是有效的页码ID';
      $scope.showErr = true;
   }

   $scope.$on('searchFinished',function(event,data){
      $timeout(function(){
         $scope.searching = false;
      },100);
      if(data.success){
         $scope.receivedList = data.result;
      }
      else{
         $scope.showErr = true;
         $scope.err = data.message;
      }
      $scope.$broadcast('pageChangeFinished');
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
         if(item.infoType === data.infoType && item.chapter._id === data.index.chapter)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
         }
         else if(data.infoType === 0 && item.work._id === data.index.work)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
         }
         else if(data.infoType === 1 && data.index.prev == null && item.work._id === data.index.work && item.work.chapterCount <= 1)
         {
            $scope.deleteList.push({index:i,item:item});
            $scope.receivedList.splice(i,1);
            i--;
            data.infoType = 0;
         }
         if(data.infoType === 1 && item.work._id === data.index.work)
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
              $scope.$emit('showError',data.message);
           }
   });

   $scope.$on('pageChange',function(event,data){
      $scope.pageId = data.pid;
      $location.search('pid',$scope.pageId);
      $scope.searching = true;
      searchManager.searchAllFanfic({searchType:$rootScope.searchList,pageId:$scope.pageId,perPage:$scope.perPage,totalNum:$scope.listNumber});
   });

   if(!$scope.showErr)
   {
      $scope.searching = true;
      searchManager.searchAllFanfic({searchType:$rootScope.searchList,pageId:$scope.pageId,perPage:$scope.perPage,totalNum:$scope.listNumber});
   }

}]);