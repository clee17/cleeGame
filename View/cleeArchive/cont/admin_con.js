app.service('adminManager',function($http,$rootScope){
    let manager =this;

    this.requestContents = function(index,pageId,perPage){
        $http.post('/admin/getTable',{data:LZString.compressToBase64(JSON.stringify({name:index,pageId:pageId,perPage:perPage}))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('admin table received',data);
                else
                    $rootScope.$broadcast('admin table received',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('admin table received',{success:false,message:'网络通信错误'});
            });
    };

    this.requestAdd = function(index){
        $http.post('/admin/addRecord',{data:LZString.compressToBase64(JSON.stringify({name:index}))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('table add finished',data);
                else
                    $rootScope.$broadcast('table add finished',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('table add finished',{success:false,message:'网络通信错误'});
            });
    };

    this.requestRemove = function(data){
        $http.post('/admin/removeRec',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('record remove finished',data);
                else
                    $rootScope.$broadcast('record remove finished',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('record remove finished',{success:false,message:'网络通信错误'});
            });
    };

});

app.directive('tableHeader',function($compile) {
    return {
        restrict: "A",
        scope:{
        },
        link: function (scope, element, attr) {
            element.css('background','rgba(223,216,214,255)');
            element.css('border-bottom','solid 1px rgba(181,163,160,218)');
            element.css('border-top','solid 1px rgba(181,163,160,218)');
            scope.$on('table refreshed',function(event,data){
                let header = data.table[0];
                if(!header)
                    return;
                let message = '<div style="min-width:12.8rem;line-height:2rem;font-weight:bold;">ID号</div>';
                for(let i in header)
                {
                    if(i == '__v')
                        continue;
                    if(i!='_id')
                      message += '<div style="min-width:12.8rem;line-height:2rem;font-weight:bold;">'+i+'</div>';
                }
                element.empty();
                element.html(message);
            })
        }
    }
});

app.directive('tableContent',function(){
    return {
        restrict: "A",
        template:'<div ng-repeat="val in list" style="display:flex;flex-direction:row;">' +
            '<div ng-show="$index != 0" style="height:60%;background:rgba(181,163,160,218);width:1px;margin-top:auto;margin-bottom:auto;margin-left:5px;margin-right:5px;"></div>' +
            '<div style="margin-top:auto;margin-bottom:auto;line-height:1.5rem;min-width:12rem;">{{val}}</div></div>',
        scope:{
           contents: '='
        },
        link: function (scope, element, attr) {
            scope.list = [];
            for(let i in scope.contents)
            {
                if(i == '__v')
                    continue;
                if(i == '$$hashKey')
                    continue;
                if(i == '_id')
                {
                    scope.list.splice(0,0,scope.contents[i]);
                    continue;
                }
                scope.list.push(scope.contents[i]);
            }
        }
    }
});
app.directive('addError',function($timeout){
    return {
        restrict: "E",
        replace:true,
        template:'<div style="margin-left:auto;margin-right:auto;">{{addErr}}</div>',
        scope:{
        },
        link: function (scope, element, attr) {
            scope.addErr = '';
            scope.timeout = null;
            element.css('transition','opacity 0.1s');
            element.css('opacity','0');
            scope.$on('action finished',function(event,data){
                scope.addErr = data.message;
                element.css('opacity','100%');
                element.css('transition','opacity 1s');
                if(scope.timeout)
                    $timeout.cancel(scope.timeout);
                scope.timeout = $timeout(function(){
                    element.css('opacity','100%');
                    element.css('transition','opacity 0.1s');
                },3*1000);
            })
        }
    }
});

app.controller("adminCon",function($scope,adminManager){
    $scope.tableId = '0';
    $scope.pageId = 0;
    $scope.perPage = 30;
    $scope.maxPage = 1;
    $scope.err = null;
    $scope.requested = false;
    $scope.requesting = false;
    $scope.contents = [];

    $scope.request = function(){
        if($scope.requesting)
            return;
        $scope.err = null;
        $scope.requesting = true;
        $scope.requested = false;
        adminManager.requestContents($scope.tableId,$scope.pageId,$scope.perPage);

    };

    $scope.requestAdd = function(){
        if($scope.requesting)
            return;
        $scope.requesting = true;
        adminManager.requestAdd($scope.tableId);
    };

    $scope.removeItem = function(_id,index){
         if($scope.requesting)
             return;
         $scope.requesting = true;
         adminManager.requestRemove({name:$scope.tableId,_id:_id,index:index});
    };

    $scope.$on('admin table received',function(event,data){
        $scope.requesting = false;
        if(data.success)
        {
            $scope.requested = true;
            $scope.contents = JSON.parse(JSON.stringify(data.contents));
            $scope.$broadcast('table refreshed',{table:$scope.contents});
        }
        else{
            $scope.err = data.message;
        }
    });

    $scope.$on('table add finished',function(event,data){
        $scope.requesting = false;
        $scope.addErr = '';
        if(data.success)
        {
            if($scope.pageId <= $scope.maxPage)
                $scope.contents.push(JSON.parse(JSON.stringify(data.contents)));
        }
        else{
            $scope.addErr = data.message;
        }
        $scope.$broadcast('action finished',{message:data.message});
    });

    $scope.$on('record remove finished',function(event,data){
        $scope.requesting = false;
        $scope.addErr = '';
        if(data.success)
        {
            $scope.contents.splice(data.index,1);
        }
        else{
            $scope.addErr = data.message;
        }
        $scope.$broadcast('action finished',{message:data.message});
    });
});