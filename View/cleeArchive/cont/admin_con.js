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

app.filter('applicationType',function(){
    return function(type){
          let typeList = ['REGISTER','WRITER','PAINTER','AUTHOR','AUTHOR','AUTHOR'];
          return typeList[type] || 'UNKNOWN';
    }
});

app.filter('applicationResult',function(){
    return function(type){
        let typeList = ['REVIEWING','APPROVED','PUSHED','DENIED'];
        return typeList[type] || 'UNKNOWN';
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


app.directive('authorAccess',function($compile){
    return {
        restrict: 'A',
        scope:{
            setting: '=',
            user:'=',
            name:"="
        },
        link:function(scope,element,attr){
            if(!scope.setting)
                element.html('<span>Setting Missing</span>')
            else{
                let access = scope.setting.access;
                let badges = [101,102];
                let innerHTML = '';
                for(let i=0;i< badges.length;++i){
                    let index = badges[i];
                    if(access.indexOf(index) >=0)
                        innerHTML += '<div class="badges" style="background-position-x:'+70*(index-101)+'px;"></div>';
                    else if(access.indexOf(index-100)>=0)
                        innerHTML +=  '<div style="position:relative;width:70px;height:70px;transform:scale(0.75);" class="badgesR" ng-click="grantAuthor('+index+",'"+scope.user+"','"+scope.name+"'"+')"><div class="badges"  style="min-width:100%;min-height:100%;filter:grayscale(1);background-position-x:'+70*(index-101)+'px;"></div>'+
                            '<div style="position:absolute;width:100%;height:100%;left:0;top:0;display:flex;font-weight:bold;"><span style="margin:auto;transform:scale(1.5);" class="badgeFont">申请中</span></div></div>';
                }
                element.html('');
                if(innerHTML !== '')
                    element.append($compile(innerHTML)(scope.$parent.$parent));
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
        '<tr><td></td><td>USER</td><td>REGISTERED</td><td>GROUP</td><td>MAIL</td><td>POINTS</td><td>IDENTITY</td><td></td><td style="width:3rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="max-width:6rem;">{{entry.user}}</td>'+
        '<td>{{entry.registered | date}} <br> {{entry.registered | time}}</td>'+
        '<td style="max-width:4rem;">{{entry.userGroup | userGroup}}</td>'+
        '<td style="max-width:8rem;">{{entry.mail}}</td>'+
        '<td>{{entry.points}}</td>'+
        '<td author-access setting="entry.setting" user="entry._id" name="entry.user" style="display:flex;flex-direction:row;"></td>'+
        '<td class="btnArea"><button ng-click="pwdReset(entry)">PWRESET</button></td>'+
        '<td></td></tr>'+
        '</table>',
    'application':'<table class="admin_table">' +
        '<tr><td></td><td>ORDER</td><td>TYPE</td><td>MAIL</td><td>REQUESTED</td><td>STATEMENTS</td><td>RESULT</td><td style="width:3rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td>{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>'+
        '<td style="max-width:6rem;">{{entry.type | applicationType}}</td>'+
        '<td style="max-width:6rem;word-break:break-all;" >{{entry.register.mail}}</td>'+
        '<td>{{entry.date | date}} <br> {{entry.date | time}}</td>'+
        '<td statements info="entry.statements" valign="top" style="max-width:15rem;padding-right:2rem;"></td>' +
        '<td>{{entry.result | applicationResult}}</td>' +
        '<td></td></tr>'+
        '</table>'
}

app.controller("adminCon",function($scope,$location,$compile,adminManager,loginManager){
    let search = $location.search();
    if(search.sid && Number(search.sid) >=0 && Number(search.sid) <=3)
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
        if(typeof $scope.selection === 'number' && $scope.selection >= 0 && $scope.selection <=3){
            let siteInfo = ['user','registration','authorization','application'];
            let condition = [{name:'user',condition:[
                    { $skip:$scope.pageInfo.perPage*($scope.pageInfo.pageId-1)},
                    { $limit:$scope.pageInfo.perPage},
                    { $lookup:{from:'register',localField:"register",foreignField:"_id",as:"register"}},
                    { $unwind:{path: "$register", preserveNullAndEmptyArrays: true }},
                    { $lookup:{from:'user_setting',localField:"_id",foreignField:"user",as:"setting"}},
                    { $unwind:{path: "$setting", preserveNullAndEmptyArrays: true }}
                ]},{name:'queue',condition:{type:0},populate:{
                    path:     'application',
                    populate: { path:  'register',
                        model: 'user_register' }
                }},{name:'queue',condition:{type:{$gte:1,$lte:5}},populate:{
                    path:     'application',
                    populate: { path:  'register',
                        model: 'user_register' }
                }},{name:'application',condition:{},populate:'register'}];
            $scope.requesting = true;
            let requestData = condition[$scope.selection];
            requestData.pageId=  $scope.pageInfo.pageId;
            requestData.perPage = $scope.pageInfo.perPage;
            $scope.requestId = siteInfo[$scope.selection]+Date.now()+':'+$scope.selection;
            requestData.requestId = $scope.requestId;
            if($scope.selection === 0){
                adminManager.request('/admin/aggregate/','administrator data received',requestData);
            }else
               adminManager.request('/admin/getTable/','administrator data received',requestData);
        }else{

        }
    }

    $scope.countPage = function(){
        $scope.pageRequesting = true;
        let siteInfo = ['user','registration','authorization','application'];
        let condition = [{name:'user'},{name:'queue',type:0},{name:'queue',type:{$gte:1,$lte:5}},{name:'application'}];
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
        }else if($scope.selection === 3){
            template = HTMLTemplate['application'];
        }
        if(template && template !== '')
           $scope.applyContents(template);
    }

    // functions of user management
    $scope.pwdReset= function(data){
        let alertInfo = {alertInfo:["您是否要重设"+data.user+"的密码？"]};
        alertInfo.variables = {_id:data._id,mail:data.mail};
        $scope.pwdSignal = alertInfo.signal =  'pwdReset' +Date.now() + data._id;
        $scope.$emit('showAlert', alertInfo);
    }

    $scope.grantAuthor = function(index,user,name){
        let author = {
            '101':'文章创作者',
            '102':'绘图创作者',
            '103':'视频剪辑者',
            '104':'游戏开发者',
            '105':'音乐制作者'
        }
        let alertInfo = {alertInfo:["您是否要给予"+name+author[index.toString()]+"权限？"]};
        alertInfo.variables = {_id:user,index:index,name:name};
        $scope.authorizeSignal = alertInfo.signal =  'authorGrant' +Date.now() + user;
        $scope.$emit('showAlert', alertInfo);
    }

    $scope.$on('tellYes',function(event,data){
        if(data.signal !== $scope.pwdSignal)
            return;
        loginManager.resetPwd({_id:data.variables._id,mail:data.variables.mail});
    });

    $scope.$on('pwdResetFinished',function(event,data){
        if(!data.success){
            $scope.$emit('showExplain',{info:'<p style="font-weight:bold;margin-left:auto;margin-right:auto;">Password reset has failed</p><p>'+data.message+'</p>',height:16});
        }else{
            $scope.$emit('showExplain',{info:'<p style="margin:auto;font-weight:bold;">password reset has succeeded!</p>',height:12});
        }
    });

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