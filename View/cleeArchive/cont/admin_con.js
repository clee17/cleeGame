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

    this.requestRegister =function(pageId,perPage){
          let data = {type:0,pageId:pageId,perPage:perPage};
          manager.request('/admin/getRegister','admin table received',data);
    };

    this.requestApplication = function(pageId,perPage){
        let data = {type:1,pageId:pageId,perPage:perPage};
        manager.request('/admin/getRegister','admin table received', data);
    };

    this.addApplication = function(data){
        manager.request('/admin/addApplication','application added',data);
    };

    this.answerApplication = function(data){
        manager.request('/admin/answerApplication','application answered',data);
    };

    this.grantAuthorize = function(data){
        manager.request('/admin/authorize','authorizeAdminFinished',data);
    };
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

app.directive('applicationType',function(){
    return {
        restrict: 'A',
        scope:{
            type:'='
        },
        link:function(scope,element,attr){
            let typeList = ['REGISTER','WRITER','PAINTER','AUTHOR','AUTHOR','AUTHOR'];
            element.css('text-align','center');
            if(scope.type === 0){
                element.html('<span style="font-weight:bold;">REGISTER</span>')
            }else if(scope.type >=1 && scope.type <= 5){
                element.html('<div class="badges" style="background-position-x:'+70*(scope.type-1)+'px;margin-left:auto;margin-right:auto;transform:scale(0.7);"></div>');
            }
        }
    }
});

app.filter('applicationResult',function(){
    return function(type){
        let typeList = ['REVIEW','APPROVED','WAITED','DENIED'];
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
            let refreshEle = function(){
                if(!scope.setting)
                    element.html('<span>Setting Missing</span>')
                else{
                    let access = scope.setting.access;
                    let badges = [101,102];
                    let innerHTML = '';
                    for(let i=0;i< badges.length;++i){
                        let index = badges[i];
                        if(__isIdentity(index,access))
                            innerHTML += '<div class="badges" style="background-position-x:'+70*(index-101)+'px;"></div>';
                        else if(__isAccessReq(index,access))
                            innerHTML +=  '<div style="position:relative;width:70px;height:70px;transform:scale(0.75);" class="badgesR" ng-click="grantAuthor('+index+",'"+scope.user+"','"+scope.name+"'"+')"><div class="badges"  style="min-width:100%;min-height:100%;filter:grayscale(1);background-position-x:'+70*(index-101)+'px;"></div>'+
                                '<div style="position:absolute;width:100%;height:100%;left:0;top:0;display:flex;font-weight:bold;"><span style="margin:auto;transform:scale(1.5);" class="badgeFont">申请中</span></div></div>';
                    }
                    element.html('');
                    if(innerHTML !== '')
                        element.append($compile(innerHTML)(scope.$parent.$parent));
                    if(access.length === 0)
                        element.html('EMPTY')
                }
            }

            scope.$on('identityUpdated',function(event,data){
                if(scope.setting && data.user === scope.setting.user){
                    console.log(scope.setting.access);
                    refreshEle();
                }
            })

            refreshEle();
        }
    }
});

app.directive('filterType',function(){
    return {
        restrict: 'A',
        scope:{
            type:'='
        },
        link:function(scope,element,attr){
            scope.$on('filterTypeChanged',function(event,data){
                if(scope.type === data.type)
                    element.css('borderBottom','solid 4px rgba(158,142,166,1)');
                else
                    element.css('borderBottom','solid 4px white');
            })

            element.on('click',function(){
                scope.$emit('filterTypeChange',{type:scope.type});
            })
        }
    }
});

let HTMLTemplate = {
    'noInfo':'<p style="margin:auto;min-width:10rem;font-size:1rem;"><b>There is no Records found under this section</b></p>',
    'queueInfo':'<table class="admin_table">' +
        '<tr><td></td><td style="text-align:center;">ORDER</td><td style="text-align:center;">TYPE</td><td style="text-align:center;">TIME</td><td>MAIL</td><td>STATEMENTS</td><td>ANSWER</td><td style="width:4rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="text-align:center;">{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>' +
        '<td application-type type="entry.application.type" align="center"></td>'+
        '<td style="text-align:center;">{{entry.application.date | date}} <br> {{entry.application.date | time}}</td>' +
        '<td style="max-width:9rem;padding-right:4px;">{{entry.application.register.mail}}</td>' +
        '<td statements info="entry.application.statements" valign="top"></td>' +
        '<td style="display:flex;flex-flow:column wrap;max-height:4rem;" class="btnArea"><button ng-click="approve(entry)">APPROVE</button><button ng-click="deny(entry)">DENY</button><button ng-click="enquire(entry)">ENQUIRE</button></td>'+
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
    'applicationHeader':'<div class="info_header">' +
        '<div filter-type type="-1">ALL</div>' +
        '<div filter-type type="0">REGISTER</div>' +
        '<div filter-type type="1">WRITER</div>' +
        '<div filter-type type="2">PAINTER</div>' +
        '</div>' +
        '<div style="min-height:2rem;display:flex;flex-direction:row;">' +
        '<div style="font-weight:bold;margin-left:4rem;margin-top:auto;margin-bottom:auto;" ng-show="counted">Total<span style="margin-left:0.5rem;margin-right:0.5rem;">{{pageInfo.maxCount}}</span>application(s)</div>'+
        '</div>',
    'applicationTable':    '<table class="admin_table" style="font-size:0.9rem;">' +
        '<tr><td style="font-size:2rem;"></td><td style="text-align:center;padding-right:0.4rem;">ORDER</td><td style="width:14rem;">APPLICATION ID</td><td style="text-align:center;">TYPE</td><td>MAIL</td><td style="text-align:center;padding-left:0.4rem;padding-right:0.4rem;">REQUESTED</td><td>STATEMENTS</td><td>RESULT</td><td></td><td style="width:2rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="text-align:center;padding-right:0.4rem;">{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>'+
        '<td style="display:flex;flex-direction:row;width:14rem;padding-right:1rem;">' +
        '<div style="width:12rem;margin-top:auto;margin-bottom:auto;text-overflow:ellipsis;overflow:hidden;">{{entry._id}}</div>' +
        '<div><button style="padding:3px;border:none;" class="copyBtn" onclick="copyPrev(this)"><i class="fa fa-copy"></i></button></div></td>'+
        '<td style="max-width:6rem;text-align:center;font-weight:bold;" application-type type="entry.type"></td>'+
        '<td style="word-break:break-all;padding-left:5px;padding-right:5px;" >{{entry.register.mail}}</td>'+
        '<td style="text-align:center;padding-left:0.4rem;padding-right:0.4rem;">{{entry.date | date}} <br> {{entry.date | time}}</td>'+
        '<td statements info="entry.statements" valign="top" style="max-width:15rem;padding-right:2rem;"></td>' +
        '<td style="font-weight:bold;">{{entry.result | applicationResult}}</td>' +
        '<td class="btnArea"><button ng-disabled="entry.result <2">REVOKE</button></td>'+
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
    $scope.newPage =true;
    $scope.admin_showTop =false;

    $scope.initializePage = function(initial){
        $scope.requesting = false;
        $scope.pageRequesting = false;
        $scope.counted = false;
        $scope.err = null;
        $scope.entries = [];
        $scope.pageInfo = {
            pageId:1,
            perPage:30,
            maxPage:1,
            maxCount:1
        }
        $scope.filter = initial && initial.filter !== undefined? initial.filter : -1;
        switch($scope.selection){
            case 0:
                $scope.pageInfo.maxPage = 15;
        }
    }

    $scope.selectTab = function(index){
        $scope.selection = index;
        $location.search('sid',index.toString());
        $scope.requesting = false;
        $scope.newPage = true;
        $scope.refreshPage();
    }

    $scope.addFilter = function(requestData){
        if($scope.filter >= 0){
            if(!requestData.condition)
                requestData.condition = {};
            requestData.condition.type = $scope.filter;
        }
    }

    $scope.requestContents = function(condition){
        if($scope.requesting)
            return;
        if(!condition && typeof $scope.selection === 'number' && $scope.selection >= 0 && $scope.selection <=3){
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
            $scope.addFilter(requestData);
            requestData.pageId=  $scope.pageInfo.pageId;
            requestData.perPage = $scope.pageInfo.perPage;
            $scope.requestId = siteInfo[$scope.selection]+Date.now()+':'+$scope.selection;
            requestData.requestId = $scope.requestId;
            if($scope.selection === 0){
                adminManager.request('/admin/aggregate/','administrator data received',requestData);
            }else
               adminManager.request('/admin/getTable/','administrator data received',requestData);
        }else if(condition){
            let requestData = JSON.parse(JSON.stringify(condition));
            requestData.pageId=  $scope.pageInfo.pageId;
            requestData.perPage = $scope.pageInfo.perPage;
            $scope.requestId = 'filterChange'+Date.now()+':'+$scope.selection;
            requestData.requestId = $scope.requestId;
            if(requestData.requestType && requestData.requestType === 1)
                adminManager.request('/admin/aggregate/','administrator data received',requestData);
            else{
                adminManager.request('/admin/getTable/','administrator data received',requestData);
            }

        }
    }

    $scope.countPage = function(condition){
        $scope.pageRequesting = true;
        let requestData = condition;
        if(!condition){
            let siteInfo = ['user','registration','authorization','application'];
            let conditions = [{name:'user'},{name:'queue',condition:{type:0}},{name:'queue',condition:{type:{$gte:1,$lte:5}}},{name:'application',condition:{}}];
            requestData = conditions[$scope.selection];
        }
        adminManager.request('/admin/countRec/','page count received',requestData);
    }

    $scope.refreshPage = function(condition,initial){
        let dashboard = document.getElementById('admin_dashboard');
        if(!dashboard)
            return;
        if($scope.newPage){
            dashboard.style.opacity = '0';
            dashboard.innerHTML = '';
        }else{
            let tables = document.getElementsByClassName('admin_table');
            for(let i=0;i<tables.length;++i){
                dashboard.removeChild(tables[i]);
            }
        }
        $scope.initializePage(initial);
        $scope.requestContents(condition);
        $scope.countPage(condition);
    };

    $scope.refreshPage();

    $scope.applyContents = function(html){
        let ele = null;
        if(html && html !== '')
           ele = $compile(html)($scope);
        let dashboard = document.getElementById('admin_dashboard');
        if(dashboard) {
            if (ele) {
                let board = angular.element(dashboard);
                board.append(ele);
            }
        }
        if(dashboard.style.opacity === '0'){
                dashboard.style.opacity = '1';
        }
        $scope.$broadcast('filterTypeChanged',{type:$scope.filter});
        $scope.newPage = false;
    }

    $scope.filterContents = function(){
        $scope.requesting = true;

    }

    $scope.getTemplate = function(){
        let template = '';
        if($scope.selection === 0){
            template = HTMLTemplate['userInfo'];
        }else if($scope.selection === 1){
            template = HTMLTemplate['queueInfo'];
        }else if($scope.selection === 2){
            template = HTMLTemplate['queueInfo'];
        }else if($scope.selection === 3){
            if(!$scope.newPage)
                template = HTMLTemplate['applicationTable'];
            else
                template = HTMLTemplate['applicationHeader']+HTMLTemplate['applicationTable'];
        }

        return template;
    }

    // functions of user management
    $scope.pwdReset= function(data){
        let alertInfo = {alertInfo:"<div>您是否要重设"+data.user+"的密码？</div>"};
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
        let alertInfo = {alertInfo:'<div>您是否要给予'+name+author[index.toString()]+'权限？</div>'};
        alertInfo.variables = {user:user,index:index,name:name};
        $scope.authorizeSignal = alertInfo.signal =  'authorGrant' +Date.now() + user;
        $scope.$emit('showAlert', alertInfo);
    }

    $scope.approve = function(entry){
        let alertInfo = {alertInfo:"<div>您是否要通过"+entry.application.register.mail+"的注册申请？</div>"};
        alertInfo.variables = {_id:entry._id,mail:entry.application.register.mail,type:entry.application.type,result:true};
        $scope.applicationSignal = alertInfo.signal =  'application' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    }

    $scope.deny = function(entry){
        let alertInfo = {alertInfo:"<div>您是否要拒绝"+entry.application.register.mail+"的注册申请？</div>"};
        alertInfo.alertInfo += '<div>请阐述原因:</div>';
        alertInfo.alertInfo += '<div><textarea style="width:100%;height:5rem;resize:none;" id="admin_application_reason"></textarea></div>'
        alertInfo.height = 19;
        alertInfo.variables = {_id:entry._id,mail:entry.application.register.mail,type:entry.application.type,result:false};
        let validate =  function(scope){
            let element = document.getElementById('admin_application_reason');
            if(element && element.value.length <= 10)
                scope.$emit('showError','The reason of rejection cannot be empty');
                return false;
        };
        alertInfo.validate = validate.bind(this,$scope);
        $scope.applicationSignal = alertInfo.signal =  'application' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    }

    $scope.enquire = function(entry){
        $scope.admin_showTop = true;
    }


    $scope.$on('filterTypeChange',function(event,data){
        if($scope.requesting)
            return;
        if($scope.selection === 3){
            let condition = {};
            condition.type = data.type >=0? data.type : null;
            if(condition.type === null)
                delete condition.type;
            $scope.refreshPage({name:'application',condition:condition,populate:'register'},{filter:data.type});
        }
    })

    $scope.$on('tellYes',function(event,data){
        if(data.signal === $scope.pwdSignal){
            loginManager.resetPwd({_id:data.variables._id,mail:data.variables.mail});
        }else if(data.signal === $scope.authorizeSignal){
            $scope.requesting = true;
            adminManager.grantAuthorize({index:data.variables.index,user:data.variables.user});
        }else if(data.signal === $scope.applicationSignal){
            $scope.requesting = true;
            let request = data.variables || {};
            request.statement = data.formData.admin_application_reason || "";
            console.log(request);
            adminManager.answerApplication(request);
        }
    });

    $scope.$on('authorizeAdminFinished',function(event,data){
        $scope.requesting = false;
        if(data.success){
            for(let i=0; i<$scope.entries.length;++i){
                if($scope.entries[i]._id === data.user){
                    $scope.entries[i].setting.access = data.access;
                }
            }
            $scope.$broadcast('identityUpdated',{user:data.user});
        }else{
            $scope.$emit('showError',data.message);
        }
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
                let template = $scope.getTemplate();
                if(template && template !== '')
                    $scope.applyContents(template);
            }
        }
    })

    $scope.$on('pageChange',function(event,data){
        $scope.pageInfo.pageId = data.pid;
        $scope.requesting = false;
        let dashboard = document.getElementById('admin_dashboard');
        if(dashboard){
            let tables = document.getElementsByClassName('admin_table');
            for(let i=0;i<tables.length;++i){
                dashboard.removeChild(tables[i]);
            }
        }
        $scope.requestContents();
    })

    $scope.$on('page count received',function(event,data){
        $scope.pageRequesting = false;
        $scope.counted = true;
        if(data.success){
            $scope.pageInfo.maxCount = data.count;
            $scope.pageInfo.maxPage = Math.ceil(data.count / $scope.pageInfo.perPage);
            if($scope.pageInfo.maxCount ===0)
                $scope.pageInfo.maxCount++;
            $scope.$broadcast('updatePageIndex',{pageId:$scope.pageInfo.pageId, totalNum:$scope.pageInfo.maxCount});
        }
    })
});