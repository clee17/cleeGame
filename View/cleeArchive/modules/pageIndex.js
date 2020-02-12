app.directive('pageIndex',['$rootScope','$location',function($rootScope,$location) {
    return {
        restrict: "E",
        scope:{
            pid:'=',
            tnm:'=',
            ppg:'='
        },
        templateUrl: '/view/modules/pageIndex.html',
        link: function (scope, element, attr){
            scope.startIndex = -1;
            scope.pageMax = -1;
            scope.pageIndex = -1;
            scope.switchingPage= false;

            scope.updatePageIndex = function(){
                scope.startIndex =  scope.pid - 3;
                if(scope.startIndex <1)
                    scope.startIndex = 1;
                scope.pageMax = Math.ceil(scope.tnm/scope.ppg);
            };

            scope.gotoPage = function(index){
                if(scope.switchingPage)
                    return;
                   scope.pid = index;
                   scope.updatePageIndex();
                   scope.switchingPage = true;
                   scope.$emit('pageChange',{pid:scope.pid});
            };

            scope.$on('pageChangeFinished',function(event,data){
                   scope.switchingPage=  false;
            });

            scope.$on('updatePageIndex',function(event,data){
                scope.pid = data.pageId;
                scope.tnm = data.totalNum;
                scope.updatePageIndex();
            });

            scope.updatePageIndex();
        }
    }
}]);