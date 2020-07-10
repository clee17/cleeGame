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

    this.addAccess = function(data){
        manager.request('/admin/addAccess','access added',data);
    };

    this.approveAccess = function(data){
        manager.request('/admin/approveAccess','access approved',data);
    };

    this.resendApplication = function(data){
        manager.request('/admin/resendApplication','application added',data);
    };

    this.answerApplicationQueue = function(data){
        manager.request('/admin/answerApplicationQueue','application answered',data);
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
            element.css('textAlign','center');
            if(scope.type === 0){
                element.html('<span class="signBtn" style="border:solid 2px rgba(158,142,166,1);color:rgba(158,142,166,1);font-weight:bold;font-size:0.85rem;transform:scale(0.85);">REGISTER</span>')
            }else if(scope.type >=1 && scope.type <= 5){
                element.html('<div class="badges" style="background-position-x:'+70*(scope.type-1)+'px;margin-left:auto;margin-right:auto;transform:scale(0.7);"></div>');
            }
        }
    }
});

app.directive('applicationResult',function(){
    return {
        restrict: 'A',
        scope:{
            id:'=',
            result: '=',
        },
        link:function(scope,element,attr){
            element.css('textAlign','center');
            let setResult = function(){
                if(typeof scope.result !== 'number'){
                    element.html('<div><i class="fas fa-info-circle"></i>No result found</div>');
                    return;
                }
                let resultList = [
                    '<span class="signBtn" style="border:solid 2px rgba(181,163,160,218);color:rgba(181,163,160,218);font-size:0.85rem;">REVIEW</span>',
                    '<span class="signBtn" style="border:solid 2px rgba(107,187,167,218);color:rgba(107,187,167,218);font-size:0.85rem;">APPROVED</span>',
                    '<span class="signBtn" style="border:solid 2px lightgray;background:lightgray;color:dimgray;transform:scale(0.85);font-size:0.85rem;">DENIED</span>',
                    '<span class="signBtn" style="border:solid 2px rgba(181,163,160,218);color:white;background:rgba(181,163,160,218);transform:scale(0.85);font-size:0.85rem;">WAITED LIST</span>'];
                let result = scope.result;
                let innerHTML =  resultList[result];
                element.html(innerHTML);
            }


            scope.$on('application result changed',function(event,data){
                if(data.id === scope.id){
                    scope.result = data.result;
                    setResult();
                }
            })

            setResult();
        }
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
                if(!scope.setting){
                    element.css('color','gray');
                    let innerHTML = '<i class="fa fa-info-circle" style="margin-right:0.5rem;"></i><span style="margin-top:auto;margin-bottom:auto;font-size:0.85rem;">user has not logged yet</span>';
                    element.html(innerHTML);
                }
                else{
                    let access = scope.setting.access;
                    let badges = [101,102];
                    let innerHTML = '';
                    for(let i=0;i< badges.length;++i){
                        let index = badges[i];
                        if(__isIdentity(index,access))
                            innerHTML += '<div class="badges" style="background-position-x:'+70*(index-101)+'px;"></div>';
                        else if(__isAccessReq(index,access))
                            innerHTML +=  '<div style="position:relative;width:70px;height:70px;transform:scale(0.75);" class="badgesR" ng-click="approveAccess('+index+",'"+scope.user+"','"+scope.name+"'"+')"><div class="badges"  style="min-width:100%;min-height:100%;filter:grayscale(1);background-position-x:'+70*(index-101)+'px;"></div>'+
                                '<div style="position:absolute;width:100%;height:100%;left:0;top:0;display:flex;font-weight:bold;"><span style="margin:auto;transform:scale(1.5);" class="badgeFont">申请中</span></div></div>';
                    }
                    element.html('');
                    if(innerHTML !== '')
                        element.append($compile(innerHTML)(scope.$parent.$parent));
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
        '<tr><td></td><td style="text-align:center;">ORDER</td><td style="text-align:center;">TIME</td><td>MAIL</td><td>STATEMENTS</td><td>ANSWER</td><td style="width:4rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="text-align:center;">{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>' +
        '<td style="text-align:center;">{{entry.application.date | date}} <br> {{entry.application.date | time}}</td>' +
        '<td style="max-width:9rem;padding-right:4px;">{{entry.application.register.mail}}</td>' +
        '<td statements info="entry.application.statements" valign="top" style="max-width:12rem;padding-right:2rem;"></td>' +
        '<td style="display:flex;flex-flow:column wrap;max-height:4rem;" class="btnArea"><button ng-click="approve(entry)">APPROVE</button><button ng-click="deny(entry)">DENY</button><button ng-click="log(entry)">LOG</button> <button ng-click="postpone(entry)">POSTPONE</button></td>'+
        '<td></td></tr>' +
        '</table>',
    'userInfo':'<table class="admin_table">' +
        '<tr><td></td><td>USER</td><td>REGISTERED</td><td>GROUP</td><td>MAIL</td><td>POINTS</td><td>IDENTITY</td><td></td><td style="width:3rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="max-width:6rem;">{{entry.user}}</td>'+
        '<td>{{entry.registered | date}} <br> {{entry.registered | time}}</td>'+
        '<td style="max-width:4rem;">{{entry.userGroup | userGroup}}</td>'+
        '<td style="max-width:8rem;">{{entry.register.mail}}</td>'+
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
        '<tr><td style="font-size:2rem;"></td><td style="text-align:center;padding-right:0.4rem;">ORDER</td><td style="width:14rem;">APPLICATION ID</td><td style="text-align:center;">TYPE</td><td>MAIL</td><td style="text-align:center;padding-left:0.4rem;padding-right:0.4rem;">REQUESTED</td><td>STATEMENTS</td><td style="text-align:center;">RESULT</td><td></td><td style="width:2rem;"></td></tr>' +
        '<tr ng-repeat="entry in entries track by $index"><td></td>' +
        '<td style="text-align:center;padding-right:0.4rem;">{{(pageInfo.pageId-1)*pageInfo.perPage + $index+1}}</td>'+
        '<td style="display:flex;flex-direction:row;width:14rem;padding-right:1rem;">' +
        '<div style="width:12rem;margin-top:auto;margin-bottom:auto;text-overflow:ellipsis;overflow:hidden;">{{entry._id}}</div>' +
        '<div><button style="padding:3px;border:none;" class="copyBtn" onclick="copyPrev(this)"><i class="fa fa-copy"></i></button></div></td>'+
        '<td style="max-width:6rem;text-align:center;font-weight:bold;" application-type type="entry.type"></td>'+
        '<td style="word-break:break-all;padding-left:5px;padding-right:5px;" >{{entry.register.mail}}</td>'+
        '<td style="text-align:center;padding-left:0.4rem;padding-right:0.4rem;">{{entry.date | date}} <br> {{entry.date | time}}</td>'+
        '<td statements info="entry.statements" valign="top" style="max-width:15rem;padding-right:2rem;"></td>' +
        '<td style="font-weight:bold;text-align:center;padding:5px;" application-result result="entry.result" id="entry._id"></td>' +
        '<td class="btnArea" style="min-width:4rem;"><button ng-disabled="entry.result <2" ng-show="entry.result >0" ng-click="resend(entry)">RESEND</button></td>'+
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

    $scope.initializePage = function(initial){
        $scope.requesting = false;
        $scope.pageRequesting = false;
        $scope.counted = false;
        $scope.err = null;
        $scope.entries = [];
        $scope.applicationAdminSignal = '';
        $scope.applicationSignal = '';
        $scope.authorizeSignal = '';
        $scope.pwdSignal = '';
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
                    { $lookup:{from:'user_register',localField:"register",foreignField:"_id",as:"register"}},
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

    $scope.approveAccess = function(index,user,name){
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
        alertInfo.variables = {_id:entry._id,application:entry.application,result:1};
        $scope.applicationSignal = alertInfo.signal =  'application' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    }

    $scope.deny = function(entry){
        let alertInfo = {alertInfo:"<div>您是否要拒绝"+entry.application.register.mail+"的注册申请？</div>"};
        alertInfo.alertInfo += '<div>请阐述原因:</div>';
        alertInfo.alertInfo += '<div><textarea style="width:100%;height:5rem;resize:none;" id="admin_application_reason"></textarea></div>'
        alertInfo.height = 19;
        alertInfo.variables = {_id:entry._id,application:entry.application,result:2};
        let validate =  function(scope){
            let element = document.getElementById('admin_application_reason');
            if(element && element.value.length <= 10){
                scope.$emit('showError','The reason of rejection cannot be empty');
                return false;
            }
            return true;
        };
        alertInfo.validate = validate.bind(this,$scope);
        $scope.applicationSignal = alertInfo.signal =  'application' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    }

    $scope.postpone = function(entry){
        let alertInfo = {alertInfo:"<div>您是否要将"+entry.application.register.mail+"的注册申请放到<b>等待列表</b>上？</div>"};
        alertInfo.alertInfo += '<div>请阐述原因:</div>';
        alertInfo.alertInfo += '<div><textarea style="width:100%;height:5rem;resize:none;" id="admin_application_reason"></textarea></div>'
        alertInfo.height = 19;
        alertInfo.variables = {_id:entry._id,application:entry.application,result:3};
        let validate =  function(scope){
            let element = document.getElementById('admin_application_reason');
            if(element && element.value.length <= 10){
                scope.$emit('showError','The reason of rejection cannot be empty');
                return false;
            }
            return true;
        };
        alertInfo.validate = validate.bind(this,$scope);
        $scope.applicationSignal = alertInfo.signal =  'application' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    };

    $scope.log = function(entry){
        $scope.$broadcast('showLogInfo',entry.application);
    }

    $scope.resend = function(entry){
        let requestType = ['registration','writer','painter'];
        let alertInfo = {alertInfo:"<div style='word-break:break-all;font-size:1.2rem;font-family:serif;'>Do you wish to resend a <b>"+requestType[entry.type]+"</b> request for <b>"+entry.register.mail+"</b></div>"};
        alertInfo.variables = entry;
        $scope.applicationAdminSignal = alertInfo.signal =  'applicationResend' +Date.now() + entry._id;
        $scope.$emit('showAlert',alertInfo);
    };


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
            adminManager.approveAccess({index:data.variables.index,user:data.variables.user});
        }else if(data.signal === $scope.applicationSignal){
            $scope.requesting = true;
            let request = data.variables || {};
            request.attach = data.formData.admin_application_reason || "";
            request.attach = encodeURIComponent(request.attach);
            console.log(request);
            adminManager.answerApplicationQueue(request);
        }else if(data.signal === $scope.applicationAdminSignal){
            $scope.requesting = true;
            adminManager.resendApplication(data.variables);
        }
    });

    $scope.$on('application answered',function(event,data){
        $scope.requesting = false;
        if(data.success){
            for(let i=0; i<$scope.entries.length;++i){
                if($scope.entries[i].application._id === data.result._id){
                    $scope.entries.splice(i,1);
                    break;
                }
            }
            if($scope.entries.length === 0)
                $scope.applyContents(HTMLTemplate['noInfo']);
            let requestType = ['registration','writer','painter'];
            let requestResult = ['reviewing','approved','denied','put on wait list'];
            $scope.$emit('showExplain',{info:'<p style="font-family:serif;">The '+requestType[data.result.type]+' request has been <b>'+requestResult[data.result.result]+'</b></p>',height:12})
        }else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('application added', function(event,data){
        $scope.requesting = false;
        if(!data.success)
            $scope.$emit('showError',data.message);
        else{
            if($scope.selection >= 1 && $scope.selection <= 2)
                $scope.entries.push(data.result);
            else if($scope.selection === 3){
                let application = data.result.application;
                for(let i=0; i<$scope.entries.length;++i){
                    if($scope.entries[i]._id === data.result.application._id){
                        $scope.entries[i].result = data.result.application.result;
                        $scope.$broadcast('application result changed',{id:data.result.application._id,result:data.result.application.result});
                        return;
                    }
                }
                $scope.entries.push(data.result.application);
            }
        }
    });

    $scope.$on('access approved',function(event,data){
        $scope.requesting = false;
        console.log(data);
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


app.controller("adminTopCon",function($scope,$rootScope,$timeout,$compile,adminManager) {
    $scope.requesting = false;
    $scope.visible = false;
    $scope.entry = null;

    $scope.showBoard = function(visible){
        let height = visible?'100vh':'0';
        let opacity = visible? '100':'0';
        let element = document.getElementById('adminTop_board');
        if(element){
            element.style.height = height;
            element.style.opacity = opacity;
        }
        $scope.requesting = false;
        $scope.messageRequesting = false;
        $scope.messageSignal = "";
        $timeout(function(){
            $scope.visible = visible;
        },210);
    }

    $scope.showInfo = function(HTML){
        let header = '<div style="height:2rem;background:rgba(223,221,220,0.9);display:flex;flex-direction:row;"><button style="margin-left:auto;margin-right:1rem;" class="closeBtn" ng-click="showBoard(false)"><i class="fas fa-times fa-2x" ></i></button></div>'
        let element = document.getElementById('adminTop_board');
        if(element){
            element.innerHTML = '';
            let angularElement = angular.element(element);
            angularElement.append($compile(header + HTML)($scope));
        }
    }

    $scope.$on('showLogInfo',function(event,data){
        $scope.requesting = true;
        $scope.visible = true;
        $scope.entry = data;
        $scope.entries = [];
        $scope.contentScope = $scope;
        $scope.showBoard(true);
        if(!$scope.entry)
            return;
        let requestData = {
            name:'conversation',
            condition:{
                application:data._id,
            },
            option:{
                sort:{date:1}
            },
            populate:'from application'
        };
        $scope.requesting = true;
        requestData.requestId = $scope.requestId = 'enquire conversation'+Date.now()+':'+$scope.entry._id;
        adminManager.request('/admin/getTable/','application log info received',requestData);
    });

    $scope.sendMessage = function() {
        let element = document.getElementById('adminTop_messageContents')
        if(!element){
            $scope.$emit('showError','No message element found');
            return;
        }
        if(element.value.length <=10){
            $scope.$emit('showError','The reason cannot be less than 10 characters');
            return;
        }
        $scope.messageRequesting = true;
        let requestData = {};
        let conversation = requestData.conversation = {};
        conversation.to = $scope.entry.register._id;
        conversation.from = $rootScope.registerId;
        conversation.application = $scope.entry._id;
        conversation.type = $scope.entry.type;
        conversation.result = $scope.entry.result;
        conversation.contents = LZString.compressToBase64(encodeURIComponent(element.value));
        requestData.targetMail = $scope.entry.register? $scope.entry.register.mail : "";
        $scope.messageRequestId = requestData.requestId = "send conversation" + Date.now() + ':' +$scope.entry._id;
        adminManager.request('/admin/addConversation', 'application conversation added', requestData);
    }

    $scope.$on('application log info received',function(event,data){
        $scope.requesting = false;
        if(data.requestId !== $scope.requestId)
            return;
        if(data.success){
            $scope.entries = data.contents;
            if($scope.entries.length === 0)
                $scope.showInfo('<div style="margin:auto;">No Log found</div>');
            else
                $scope.showInfo('<div style="flex:1;padding:2rem;padding-bottom:1rem;display:flex;flex-direction:column;"><div style="flex:1;margin-left:2rem;margin-right:2rem;padding-right:2rem;overflow-y:scroll;display:flex;flex-direction:column;"><div ng-repeat="entry in entries" style="display:flex;flex-direction:column;">' +
                    '<div style="display:flex;flex-direction:row;margin-top:1rem;margin-bottom:0.5rem;"><span style="font-weight:bold;">FROM:</span><span style="margin-left:0.8rem;"> {{entry.from? entry.from.user: "the user has no registration info" }}</span>' +
                    '<span style="margin-left:4rem;font-weight:bold;">DATE:</span><span>{{entry.date | dateInfo}}</span>'+
                    '<span style="margin-left:4rem;font-weight:bold;">STATUS:</span><span application-result result="entry.result" style="margin-left:0.8rem;"></span></div>' +
                    '<div content-format content="entry.contents" style="margin-bottom:1.5rem;padding:0.5rem;"></div>'+
                    '<div style="min-width:80%;background:rgba(185,185,185,0.6);height:1px;"></div>'+
                    '</div></div>'+
                    '<div style="margin-top:auto;margin-bottom:0.5rem;padding-left:2rem;padding-right:2rem;">' +
                    '<div><span style="font-weight:bold;">FROM: YOU</span><span style="margin-left:0.8rem;font-size:0.8rem;color:gray;">You could send a message to the applicant for further information if you could not decide if the request should be approved or not.</span></div>'+
                    '<div><textarea id="adminTop_messageContents" style="height:6rem;width:calc(100% - 3rem);margin-left:1.5rem;margin-top:0.5rem;resize:none;padding:8px;"></textarea></div>'+
                    '<div style="display:flex;margin-top:0"><button class="grand-button" style="margin-left:auto;margin-right:2rem;margin-top:1rem;" ng-click="sendMessage()" ng-disabled="messageRequesting">SEND</button></div>'+
                    '</div></div>')
        }else{
            $scope.showInfo('<div style="margin:auto;">No Log found</div>')
        }
    });
});