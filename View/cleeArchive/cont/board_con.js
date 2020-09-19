app.filter('username', function() { //可以注入依赖
    return function(user) {
        if(!user)
            return '匿名';
        else if(user)
            return user.user || 'unknown error';
    }
});

app.filter('trim', function() { //可以注入依赖
    return function(name) {
        return decodeURIComponent(name);
    }
});

app.filter('category', function() { //可以注入依赖
    return function(order,category) {
        if(!category){
            return 'unknown error';
        }
        var getCategory = function(order_type) {
            for(let i=0;i<category.length;++i) {
                if(category[i].order === order_type)
                    return decodeURIComponent(category[i].name);
            }
            return 'unknown error';
        };
       if(!order)
           return getCategory(0);
       else
           return getCategory(order);
    }
});

app.controller("thread_con",['$scope','$rootScope','$cookies','$location','$timeout','boardManager',function($scope,$rootScope,$cookies,$location,$timeout,boardManager){
    $rootScope.thread.board.title = unescape($rootScope.thread.board.title);
    $rootScope.thread.board.title = $rootScope.thread.board.title.toUpperCase();
    let index = $rootScope.thread.board._id + ($rootScope.isVisitor ? 'Visitor':$rootScope.readerId);
    $scope.adminAccess = $cookies.get(index);
    if($scope.adminAccess !== undefined) {
        $scope.adminAccess = JSON.parse(LZString.decompressFromBase64($scope.adminAccess));
        $scope.adminAccess = $scope.adminAccess.access;
    }else
        $scope.adminAccess = 0;

    $scope.initializeEditor = function(){
        let info = {blocked:$rootScope.blocked,access:$scope.adminAccess,targetRight:parseInt('000010',2)};
        if($rootScope.blocked){
            $scope.message_block_date = $scope.message_block_date.replace(/%n/g,$rootScope.blockedDate);
        }
        info.user_blocked = $scope.message_blocked_user+',' + $scope.message_block_date;
        if($rootScope.isVisitor)
            info.user_blocked += $scope.message_non_registered;
        info.message = $scope.message_visitor_noreply;
        $scope.$broadcast('initialize editor', info);
    };

    $scope.accessable = function(index){
        return $scope.adminAccess & index;
    };

    $scope.totalNum = $rootScope.replies.length;

    $scope.pageIndex =  $location.search().id ||1;
    $scope.perPage = 35;

    $scope.newReply_grade = '0';

    $scope.getBoardLink = function(){
        let boardTitle = $rootScope.thread.board.title;
        if(boardTitle === 'NEWS')
            return '/news';
        else
            return '/board/'+$rootScope.thread.board._id;
    };

    $scope.publishReply = function(){
        $scope.requesting  = true;
        let data = {
            board_id:$rootScope.thread.board._id,
            editor_id:'reply_editor',
            author:$rootScope.readerId,
            thread:$rootScope.thread._id,
            grade:Number($scope.newReply_grade),
        };
        $scope.$broadcast('publish new reply',data);
    };

    $scope.cancelPublishReply = function(){
        $scope.requesting  = false;
    };

    $scope.sendDeleteThread = function(data){
        $scope.$broadcast('stop thread');
        boardManager.deleteThread({id:threadId,board_id:$rootScope.thread.board._id,author:data.author._id});
        $scope.requesting = true;
    };

    $scope.deleteThread = function(){
        let alertMessage= $scope['alert_delete_thread'];
        if(alertMessage)
            alertMessage = unescape(alertMessage);
        alertMessage=  alertMessage.replace(/%t/g,$rootScope.thread.title);
        let alertInfo = {alertInfo:alertMessage};
        alertInfo.variables = {_id:$rootScope.thread._id,author:$rootScope.thread.author._id,info:'delete thread'};
        $scope.$emit('showAlert', alertInfo);
    };

    $scope.blockUser = function(info,user,ip){
        if(info)
            info.muting = true;
        boardManager.blockUser({board_id:$rootScope.thread.board._id,
            thread:$rootScope.thread._id,
            _id:info._id,
            user:user,
            ip:ip});
    };

    $scope.editContents = function(id,type){
        if(!id)
            return;
        let newLink = '/boardMessage/edit?type='+type+'&id='+id;
        window.location.href = newLink;
    };

    $scope.hideContents = function(reply){
        let type = reply? 1:0;
        let status = 0;
        if(reply && !reply.status)
            status = 1;
        else if(!reply && !$rootScope.thread.status)
            status = 1;
        let send = {board_id:$rootScope.thread.board._id,thread:$rootScope.thread._id,_id:reply?reply._id:$rootScope.thread._id,type:type,status:status};
        boardManager.hideContents(send);
        if(reply){
            reply.hiding = true;
        }else
           $rootScope.thread.hiding = true;
    };

    $scope.deleteContents = function(reply){
        if($rootScope.thread.deleting || (reply && reply.deleting))
            return;
        if(reply)
            reply.deleting = true;
        else
            $rootScope.thread.deleting = true;
        if(reply)
            boardManager.deleteReply({id:reply._id,board_id:$rootScope.thread.board._id,thread:$rootScope.thread._id,author:reply.author? reply.author._id : null});
        else
            boardManager.deleteThread({id:$rootScope.thread._id,board_id:$rootScope.thread.board._id,author:$rootScope.thread.author._id});
    };

    $scope.$on('board contents hide',function(event,data){
        if(!data.success){
            $scope.$emit('showError',data.message);
            return;
        }

        if(data.type === 0 && data._id === $rootScope.thread._id){
            $rootScope.thread.hiding = false;
            if(data.success)
                $rootScope.thread.status = data.status;
        }else{
            for(let i=0; i<$rootScope.replies.length;++i){
                if($rootScope.replies[i]._id === data._id){
                    $rootScope.replies[i].hiding = false;
                    if(data.success)
                        $rootScope.replies[i].status = data.status;
                }
            }
        }
    });

    $scope.$on('user blocked',function(event,data){
        if(data.success){
            $scope.$emit('showExplain',{info:data.userBlocked? $scope.message_user_blocked: $scope.message_user_unblocked,height:13});
            if($rootScope.thread._id === data._id){
                $rootScope.thread.muting = false;
                $rootScope.thread.userBlocked = data.userBlocked;
            }
            for(let i=0; i<$rootScope.replies.length;++i){
                if($rootScope.replies[i]._id === data._id) {
                    $rootScope.replies[i].muting = false;
                    $rootScope.replies[i].userBlocked = data.userBlocked;
                }
            }
        }else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('reply deleted',function(event,data){
        if(!data.success)
            $scope.emit('showError',data.message);
        for(let i=0; i<$scope.replies.length;++i){
            if($scope.replies[i]._id === data.result._id){
                if(data.success){
                    $scope.replies.splice(i,1);
                    break;
                }else
                    $scope.replies[i].deleting = false;
            }
        }
    });

    $scope.$on('thread deleted',function(event,data){
        if(data.success){
            let newLink = $scope.getBoardLink();
            $scope.$emit('showExplain',{info:$scope.message_thread_deleted,height:14,selection:false});
            $timeout(function(){
               window.location.href = newLink;
            },2000);
        }else{
            $rootScope.thread.deleting = false;
            $scope.$emit('showError',data.message);
        }
    });


    $scope.$on('send new editor contents',function(event,data){
        if(data.editor_id === "reply_editor"){
            if(data.editor_id !== undefined)
                delete data.editor_id;
            boardManager.submitNewReply(data);
        }
    });

    $scope.$on('new reply submitted',function(event,data){
        $scope.requesting = false;
        $scope.$broadcast('new contents submitted', {success:data.success,message:data.message});
        if(data.success){
            $rootScope.replies.push(data.reply);
            $rootScope.thread.replied = $rootScope.replies.length;
        }else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.$on('tellYes',function(event,data){
        if(data.variables['info'] === 'delete thread'){
            $scope.sendDeleteThread(data.variables);
        }
    });

    $scope.initialize();

}]);


app.controller("board_con",['$scope','$rootScope','$cookies','$location','$timeout','boardManager',function($scope,$rootScope,$cookies,$location,$timeout,boardManager){
    $scope.requested = false;
    $scope.requesting = false;
    $scope.newThread_title = '';
    $scope.newThread_grade = '0';
    $scope.newThread_category = null;
    $scope.threads = [];

    $scope.pageIndex =  $location.search().id ||1;
    $scope.perPage = 35;

    $scope.pageId = $location.search().id || 1;

    $scope.initialize = function(){
        $scope.requesting= true;
        boardManager.requestThreads({board_id:$scope['board_id'],board_setting:['board_setting'],pageId:$scope.pageId});
    };

    $scope.initializeEditor = function(){
        let info = {access:0,targetRight:parseInt('0000001',2)};
        if($rootScope.isVisitor){
            info.message = $scope.message_nonew_visitor;
            info.access = $scope.personal_visitor;
        }else{
            info.access =  $scope.personal_usergroup &$scope.personal_user;
            info.message = $scope.message_nonew_user;
        }
        info.user_blocked = $scope.message_blocked_user+',' + $scope.message_block_date;
        if($rootScope.isVisitor)
            info.user_blocked += ','+$scope.message_non_registered;
        $scope.$broadcast('initialize editor',info);
    };

    $scope.newThread = function(){
        let element =  document.getElementById("reply_board");
        if(element){
            element.style.display = 'flex';
        }
        $timeout(function(){
            element.style.opacity = '1';
        },10)
    };


    $scope.deleteThread = function(thread){
        let alertMessage= $scope['alert_delete_thread'];
        if(alertMessage)
            alertMessage = unescape(alertMessage);
        alertMessage=  alertMessage.replace(/%t/g,thread.title);
        let alertInfo = {alertInfo:alertMessage};
        alertInfo.variables = {_id:thread._id,author:thread.author,info:'delete thread'};
        $scope.$emit('showAlert', alertInfo);
    };

    $scope.cancelNewthread = function(){
        let element =  document.getElementById("reply_board");
        if(element){
            element.style.opacity = '0';
        }
        $timeout(function(){
            element.style.display = 'none';
        },150)
    };


    $scope.cancelSubmitThread  = function(event,data){
        let input = document.getElementById('tinymce_title');
        if(input)
            input.style.background = 'white';
        $scope.requesting = false;
    };

    $scope.publish = function(){
        if($scope.newThread_title.length === 0){
            $scope.$emit('showError', $scope['message_no_title']);
            return;
        }else if($scope.newThread_title.length < 5){
            let error = $scope['message_title'].replace(/%l/,'5');
            $scope.$emit('showError',error);
            return;
        }
        $scope.requesting = true;
        let input = document.getElementById('tinymce_title');
        if(input)
            input.style.background = 'rgba(185,185,185,0.8)';
        $scope.$broadcast('publish new thread',{board_id:$scope.board_id,
            editor_id:'thread_editor',
            author:$rootScope.readerId,
            grade:Number($scope.newThread_grade),
            category:Number($scope.newThread_category.order),
            title:escape($scope.newThread_title)});
    };


    $scope.sendDeleteThread = function(data){
        let threadId = data._id;
        for(let i=0; i<$scope.threads.length;++i){
            if($scope.threads[i]._id === threadId){
                $scope.tempstorage = {
                    i:i,
                    thread:$scope.threads[i]
                }
                $scope.threads.splice(i,1);
                boardManager.deleteThread({id:threadId,board_id:$scope.board_id,author:data.author._id});
                break;
            }
        }
    };


    $scope.getBoardLink = function(){
            return window.location.pathname;
    };

    $scope.$on('tellYes',function(event,data){
       if(data.variables['info'] === 'delete thread'){
           $scope.sendDeleteThread(data.variables);
       }
    });

    $scope.$on('new thread submitted',function(event,data){
        $scope.cancelSubmitThread();
        $scope.$broadcast('new contents submitted', {success:data.success});
        if(data.success){
            $scope.newThread_title = "";
            $scope.newThread_grade = '0';
            $scope.threads.unshift(data.thread);
            $scope.cancelNewthread();
        }else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.$on('threads requested finished',function(event,data){
        $scope.requesting = false;
        if(data.success)
            $scope.threads = data.result;
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('thread deleted',function(event,data){
        if(!data.success){
            $scope.entries.splice($scope.tempstorage.i,0,$scope.tempStorage.thread);
        }
        $scope.tempStorage = null;
    });

    $scope.$on('send new editor contents',function(event,data){
        if(data.editor_id === "thread_editor"){
            if(data.editor_id !== undefined)
                 delete data.editor_id;
            boardManager.submitNewThread(data);
        }
    })
}]);

app.controller("TinyMceController",['$scope','$rootScope','$cookies','$location','$timeout',function($scope,$rootScope,$cookies,$location,$timeout){
    $scope.tinymceModel = '';

    $scope.$on('textFinished',function(event,data){
        $scope.tinymceText = data["text"] || "";
    });

    $scope.tinymceOptions = {
        height:"100%",
        menubar: false,
        width:"100%",
        resize:false,
        statusbar:false,
        paste_as_text: true,
        skin:"archive_cleegame",
        content_css:"archive",
        plugins: 'paste link image lists code',
        toolbar: 'fontsizeselect forecolor backcolor | bold italic strikethrough underline | alignleft aligncenter alignright | bullist numlist | link image ',
        image_dimensions: false,
        image_description:false,
    };
    //注意后面可以增加一个code用来设置代码

    $scope.$on('publish new thread',function(event,data){
        if(data['editor_id'] !== $scope.editor_id)
            return;
        if($scope.getPlainText)
            $scope.getPlainText();
        let trueText = $scope.tinymceText.replace(/\s+/g,"");
        if(trueText <= 25){
            $scope.$emit('showError',$scope.$parent['message_threadlen']);
            $scope.$parent.cancelSubmitThread();
            return;
        }
        data.contents = LZString.compressToBase64($scope.tinymceModel);
        if(data.contents.length === 0){
            $scope.$parent.cancelSubmitThread();
            return;
        }
        if($scope.toggleEditor)
            $scope.toggleEditor(false);
        data.editor_id = $scope.editor_id;
        $scope.$emit('send new editor contents', data);
    });

    $scope.$on('publish new reply',function(event,data){
        if(data['editor_id'] !== $scope.editor_id)
            return;
        if($scope.getPlainText)
            $scope.getPlainText();
        let trueText = $scope.tinymceText.replace(/\s+/g,"");
        if(trueText.length <= 15){
            let text = $scope.$parent['message_length'].replace(/%n/g,15);
            $scope.$emit('showError',text);
            $scope.$parent.cancelPublishReply();
            return;
        }
        data.contents = LZString.compressToBase64($scope.tinymceModel);
        if(data.contents.length === 0){
            $scope.$parent.cancelPublishReply();
            return;
        }
        if($scope.toggleEditor)
            $scope.toggleEditor(false);
        data.editor_id = $scope.editor_id;
        $scope.$emit('send new editor contents', data);
    });


    $scope.$on('new contents submitted',function(event,data){
        $scope.awaitingReply = false;
        if(data.success){
            $scope.tinymceModel = "";
            $scope.tinymceText = "";
        }else{
        }
        if($scope.toggleEditor)
            $scope.toggleEditor(true);
    });


    $scope.$on('stop thread',function(event,data){
        if($scope.toggleEditor)
            $scope.toggleEditor(false);
    });

    $scope.$on('initialize editor',function(event,data){
        let allowNew = parseInt('0000001',2);
        if(data.blocked){
            $scope.toggleEditor(false);
            $scope.$parent.editorActive = false;
            $scope.tinymceModel = data.user_blocked;
        } else{
            $scope.$parent.editorActive = (data.access & data.targetRight) >0;
            $scope.toggleEditor((data.access & data.targetRight) >0);
            $scope.tinymceModel = (data.access & data.targetRight) >0 ? '':data.message;
        }
    });

    let editorInitialize = function(){
        if($scope.$parent.initializeEditor && $scope.instantiated && $scope.instantiated() && $scope.toggleEditor)
            $scope.$parent.initializeEditor();
        else
            $timeout(editorInitialize,100);
    };

    editorInitialize();

}]);