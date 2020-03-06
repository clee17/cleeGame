app.service('adminManager',function($http,$rootScope){
    let manager = this;
    this.request = function(site,info,data,ifInfoReceived){
        $http.post(site,{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(ifInfoReceived)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(info,receivedData);
                },
                function(err){

                    $rootScope.$broadcast(info,{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    };

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

    this.requestRegister =function(pageId,perPage){
          let data = {type:0,pageId:pageId,perPage:perPage};
          manager.request('/admin/getRegister','admin table received',data);
    };

    this.requestApplication = function(pageId,perPage){
        let data = {type:1,pageId:pageId,perPage:perPage};
        manager.request('/admin/getRegister','admin table received', data);
    };

    this.answerApplication = function(data){
        manager.request('/admin/answerRegister','request replied',data);
    };

    this.addApplication = function(data){
        manager.request('/admin/addApplication','application added',data);
    }

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
                let header = data.head;
                if(!header)
                    return;
                let message = '';
                for(let i =0;i <header.length;++i){
                      message += '<div style="width:8rem;min-width:8rem;line-height:2rem;font-weight:bold;">'+header[i]+'</div>';
                }
                element.empty();
                element.html(message);
            });
        }
    }
});

app.directive('tableContent',['adminManager','loginManager',function(adminManager,loginManager){
    return {
        restrict: "A",
        link: function (scope, element, attr) {
            scope.refreshHTML = function(){
                scope.val = [];
                for(let attr in scope.item){
                    scope.val.push({key:attr,value:scope.item[attr]});
                }
                let innerHTML = '<div style="display:flex;flex-direction:row;">';
                for(let i=0; i<scope.$parent.head.length;++i){
                    for(let j=0;j<scope.val.length;++j){
                        if(scope.val[j].key === scope.$parent.head[i]) {
                            let val = scope.val[j].value;
                            if((scope.$parent.tableId === '2' || scope.$parent.tableId === '3' )&& scope.val[j].key === 'statements')
                                scope.val[j].value = LZString.decompressFromBase64(scope.val[j].value);
                            else if (scope.$parent.tableId === '1' && scope.val[j].key === 'intro')
                                scope.val[j].value = LZString.decompressFromBase64(scope.val[j].value);
                            innerHTML += '<div style="padding-right:1rem;width:7rem;word-break:break-all;">' + scope.val[j].value + '</div>';
                        }
                    }
                }
                innerHTML += '</div>';
                element.html(innerHTML);
            };

            scope.refreshHTML();

            scope.answerRegister = function(agree){
                let status = agree? 1 : 2;
                adminManager.answerApplication({item:scope.item,status:status,mail:scope.item.mail,subType:9999});
            };

            scope.resetPwd = function(){
                loginManager.resetPwd(scope.item);
            };

            scope.allowAccess = function(agree){
                let status = agree? 1 : 2;
                 adminManager.addApplication({item:scope.item,subType:9999});
            };

            scope.$on('table content refreshed',function(event,data){
                if(data._id == scope.item._id)
                    scope.refreshHTML();
            });
        }}
}]);

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
            });
        }
    }
});

app.controller("adminCon",function($scope,adminManager){
    $scope.tableId = '1';
    $scope.pageId = 0;
    $scope.perPage = 30;
    $scope.maxPage = 1;
    $scope.err = null;
    $scope.requested = false;
    $scope.requesting = false;
    $scope.contents = [];
    $scope.btn  = {
        editNeeded:false,
        deleteNeeded:false,
        registerPermitNeeded: false,
        registerDeclineNeeded:false,

    };

    $scope.request = function(){
        if($scope.requesting)
            return;
        $scope.err = null;
        $scope.requesting = true;
        $scope.requested = false;
        if($scope.tableId ===  '2')
             adminManager.requestRegister($scope.pageId,$scope.perPage);
        else if($scope.tableId === '3')
              adminManager.requestApplication($scope.pageId,$scope.perPage);
        else
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

    $scope.initializeBtn = function(){
        for(let attr in $scope.btn){
            $scope.btn[attr] = false;
        }
        if($scope.tableId === '0'){
            $scope.btn.deleteNeeded = true;
        }
        else if ($scope.tableId === '1'){
            $scope.btn.resetPwdNeeded = true;
        }
        else if($scope.tableId === '2'){
            $scope.btn.registerPermitNeeded = true;
            $scope.btn.registerDeclineNeeded = true;
        }else if($scope.tableId === '3'){
            $scope.btn.accessNeeded = true;
            $scope.btn.accessDeclined = true;
        }
    };

    $scope.$on('admin table received',function(event,data){
        $scope.requesting = false;
        if(data.success)
        {
            $scope.requested = true;
            $scope.head = [];
            if($scope.tableId === '0')
                $scope.head = ['_id','date'];
            else if($scope.tableId === '1')
                $scope.head = ['_id','user','userGroup','mail','intro'];
            else if($scope.tableId === '2' || $scope.tableId === '3')
                $scope.head = ['_id','mail','count','date','statements','status','subType'];
            $scope.initializeBtn();
            $scope.$broadcast('table refreshed',{head:$scope.head});
            $scope.contents = JSON.parse(JSON.stringify(data.contents));
        }
        else{
            $scope.$emit('showError',data.message);
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

    $scope.$on('request replied',function(event,data){
        if(data.success){
            for(let i=0; i<$scope.contents.length;++i){
                if(data.contents._id == $scope.contents[i]._id){
                    $scope.contents[i].status = data.contents.status;
                    $scope.contents[i].subType = data.contents.subType;
                    $scope.$broadcast('table content refreshed',data.contents);
                }
            }
        }else{
            $scope.$emit('showError',data.message);
        }
        $scope.requesting = false;
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