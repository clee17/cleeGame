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


app.filter('date',function(){
    return function(date){
        if(!date)
            return 'UNKNOWN';
        let finalDate = new Date(date);
        let year = finalDate.getFullYear();
        let month = finalDate.getMonth()+1;
        let day = finalDate.getDate();
        return year+'-'+month+'-'+day;
    }
});

app.filter('time',function(){
    return function(date,format){
        if(!date)
            return '';
        let finalDate = new Date(date);
        let hour = finalDate.getHours();
        let min = finalDate.getMinutes();
        let sec = finalDate.getSeconds();
        return hour+':'+min+':'+sec;
    }
});

app.filter('userGroup',function(){
    return function(group){
       if(group === 0)
           return 'general user';
       else if(group >= 99)
           return 'administrator';
    }
});

app.directive('statements',function(){
    return {
        restrict: 'A',
        scope:{
            info: '=',
        },
        link:function(scope,element,attr){
            if(scope.info === '')
                element.html('NO DATA');
            else{
                let statements = LZString.decompressFromBase64(scope.info);
                if(statements)
                    statements = statements.replace(/\n/gi,'<br>');
                element.html(statements);
            }
        }
    }
});


let HTMLTemplate = {
    'noInfo':'<p style="margin:auto;min-width:10rem;font-size:1rem;"><b>There is no Records found under this section</b></p>',
    'registrationInfo':'<table class="admin_table">' +
        '<tr><td></td><td style="text-align:center;">ORDER</td><td style="text-align:center;">TIME</td><td>MAIL</td><td>STATEMENTS</td><td>ANSWER</td><td style="width:4rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="text-align:center;">{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>' +
        '<td style="text-align:center;">{{entry.application.date | date}} <br> {{entry.application.date | time}}</td>' +
        '<td style="max-width:9rem;padding-right:4px;">{{entry.application.register.mail}}</td>' +
        '<td statements info="entry.application.statements" valign="top"></td>' +
        '<td style="display:flex;flex-flow:column wrap;max-height:4rem;" class="btnArea"><button>APPROVE</button><button>DENY</button><button>ENQUIRE</button></td>'+
        '<td></td></tr>' +
        '</table>',
    'userInfo':'<table class="admin_table">' +
        '<tr><td></td><td>USER</td><td>REGISTERED</td><td>GROUP</td><td>MAIL</td><td>POINTS</td><td>IDENTITY</td><td></td><td style="width:4rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td>{{entry.user}}</td>'+
        '<td>{{entry.registered | date}} <br> {{entry.registered | time}}</td>'+
        '<td>{{entry.userGroup | userGroup}}</td>'+
        '<td>{{entry.mail}}</td>'+
        '<td>{{entry.points}}</td>'+
        '<td>TBD(权限图片)</td>'+
        '<td class="btnArea"><button>PASSWORD RESET</button></td>'+
        '<td></td></tr>'+
        '</table>'
}

app.controller("adminCon",function($scope,$location,$compile,adminManager){
    let search = $location.search();
    if(search.sid && Number(search.sid) >=0 && Number(search.sid) <=2)
        $scope.selection = Number(search.sid);
    else if(!search.sid){
        $location.search('sid','0');
        $scope.selection = 0;
    }

    $scope.initializePage = function(){
        $scope.requesting = false;
        $scope.pageRequesting = false;
        $scope.err = null;
        $scope.entries = [];
        $scope.pageInfo = {
            pageId:1,
            perPage:30,
            maxPage:1,
            maxCount:1
        }
        switch($scope.selection){
            case 0:
                $scope.pageInfo.maxPage = 15;
        }
    }

    $scope.selectTab = function(index){
        $scope.selection = index;
        $location.search('sid',index.toString());
        $scope.requesting = false;
        $scope.refreshPage();
    }

    $scope.requestContents = function(){
        if($scope.requesting)
            return;
        if(typeof $scope.selection === 'number' && $scope.selection >= 0 && $scope.selection <3){
            let siteInfo = ['user','registration','authorization'];
            let condition = [{name:'user'},{name:'queue',type:0,populate:{
                    path:     'application',
                    populate: { path:  'register',
                        model: 'user_register' }
                }},{name:'queue',type:{$gte:1,$lte:5},populate:{
                    path:     'application',
                    populate: { path:  'register',
                        model: 'user_register' }
                }}];
            $scope.requesting = true;
            let requestData = condition[$scope.selection];
            requestData.pageId=  $scope.pageInfo.pageId;
            requestData.perPage = $scope.pageInfo.perPage;
            $scope.requestId = siteInfo[$scope.selection]+Date.now()+':'+$scope.selection;
            requestData.requestId = $scope.requestId;
            adminManager.request('/admin/getTable/','administrator data received',requestData);
        }else{

        }
    }

    $scope.countPage = function(){
        $scope.pageRequesting = true;
        let siteInfo = ['user','registration','authorization'];
        let condition = [{name:'user'},{name:'queue',type:0},{name:'queue',type:{$gte:1,$lte:5}}];
        let requestData = condition[$scope.selection];
        adminManager.request('/admin/countRec/','page count received',requestData);
    }

    $scope.refreshPage = function(){
        let dashboard = document.getElementById('admin_dashboard');
        if(dashboard){
            dashboard.style.opacity = '0';
            dashboard.innerHTML = '';
        }
        $scope.initializePage();
        $scope.requestContents();
        $scope.countPage();
    };

    $scope.refreshPage();

    $scope.applyContents = function(html){
        let ele = null;
        if(html && html !== '')
           ele = $compile(html)($scope);
        let dashboard = document.getElementById('admin_dashboard');
        if(dashboard)
        {
            if(ele){
                let board  = angular.element(dashboard);
                board.append(ele);
            }
            dashboard.style.opacity = '1';
        }
    }

    $scope.getTemplate = function(){
        let template = '';
        if($scope.selection === 0){
            template = HTMLTemplate['userInfo'];
        }else if($scope.selection === 1){
            template = HTMLTemplate['registrationInfo'];
        }else if($scope.selection === 2){
            template = HTMLTemplate['Authorization'];
        }
        if(template && template !== '')
           $scope.applyContents(template);
    }

    $scope.$on('administrator data received',function(event,data){
        $scope.requesting = false;
        $scope.$broadcast('pageChangeFinished',{});
        if(!data.success){
            $scope.$emit('showError',data.message);
        }else {
            if($scope.requestId  !== data.requestId)
                return;
            $scope.entries = data.contents || [];
            if($scope.entries.length === 0){
                $scope.applyContents(HTMLTemplate['noInfo']);
            }else{
                $scope.getTemplate();
            }
        }
    })

    $scope.$on('pageChange',function(event,data){
        $scope.pageInfo.pageId = data.pid;
        $scope.requesting = false;
        let dashboard = document.getElementById('admin_dashboard');
        if(dashboard){
            dashboard.style.opacity = '0';
            dashboard.innerHTML = '';
        }
        $scope.requestContents();
    })

    $scope.$on('page count received',function(event,data){
        $scope.pageRequesting = false;
        if(data.success){
            $scope.pageInfo.maxCount = data.count;
            $scope.pageInfo.maxPage = Math.ceil(data.count / $scope.pageInfo.perPage);
            if($scope.pageInfo.maxCount ===0)
                $scope.pageInfo.maxCount++;
            $scope.$broadcast('updatePageIndex',{pageId:$scope.pageInfo.pageId, totalNum:$scope.pageInfo.maxCount});
        }
    })

});