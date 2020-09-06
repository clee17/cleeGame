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
        }
       if(!order)
           return getCategory(0);
       else
           return getCategory(order);
    }
});



app.controller("thread_con",['$scope','$rootScope','$cookies','$location','$timeout','boardManager',function($scope,$rootScope,$cookies,$location,$timeout,boardManager){
    $rootScope.thread.board.title = unescape($rootScope.thread.board.title);
    $rootScope.thread.board.title = $rootScope.thread.board.title.toUpperCase();

    $scope.getBoardLink = function(){
        let boardTitle = $rootScope.thread.board.title;
        if(boardTitle === 'NEWS')
            return '/news';
        else
            return '/board/'+$rootScope.thread.board._id;
    }
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
        $scope.$broadcast('initialize editor', {usergroup:$scope.usergroup,user:$scope.user});
        boardManager.requestThreads({board_id:$scope['board_id'],board_setting:['board_setting'],pageId:$scope.pageId});
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
        if($scope.newThread_title.length ==0){
            $scope.$emit('showError', $scope['message_no_title']);
            return;
        }else if($scope.newThread_title.length < 8){
            let error = $scope['message_title'].replace(/%l/,'8');
            $scope.$emit('showError',error);
            return;
        }
        $scope.requesting = true;
        let input = document.getElementById('tinymce_title');
        if(input)
            input.style.background = 'rgba(185,185,185,0.8)';
        $scope.$broadcast('publish new thread',{board_id:$scope.board_id,
            editor_id:'thread_editor',
            user:$rootScope.readerId,
            grade:Number($scope.newThread_grade),
            category:Number($scope.newThread_category.order),
            title:encodeURIComponent($scope.newThread_title)});
    };

    $scope.sendDeleteThread = function(data){
        let threadId = data._id;
        for(let i=0; i<$scope.threads.length;++i){
            if($scope.threads[i]._id === threadId){
                $scope.threads.splice(i,1);
                boardManager.deleteThread({id:threadId,board_id:$scope.board_id,author:data.author._id});
                break;
            }
        }
    };

    $scope.getBoard = function(thread){
       if($rootScope.boardType === 'news')
           return '/news';
        else if($rootScope.boardType === 'event')
            return '/events';
        else
            return '/board'+thread._id;
    };

    $scope.$on('tellYes',function(event,data){
       if(data.variables['info'] === 'delete thread'){
           $scope.sendDeleteThread(data.variables);
       }
    });

    $scope.$on('new thread submitted',function(event,data){
        $scope.cancelSubmitThread();
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
        console.log(data);
    })
}]);

app.controller("TinyMceController",['$scope','$rootScope','$cookies','$location','boardManager',function($scope,$rootScope,$cookies,$location,boardManager){
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
        toolbar: 'fontsizeselect forecolor backcolor | bold italic strikethrough underline | alignleft aligncenter alignright | bullist numlist | link image | code',
        image_dimensions: false,
        image_description:false,
    };

    $scope.$on('publish new thread',function(event,data){
        if(data['editor_id'] !== $scope.editor_id)
            return;
        if($scope.getPlainText)
            $scope.getPlainText();
        if($scope.tinymceText.length <= 25){
            $scope.$emit('showError',$scope.$parent['message_threadlen']);
            $scope.$parent.cancelSubmitThread();
            return;
        }
        if($scope.toggleEditor)
            $scope.toggleEditor(false);
        data.contents = encodeURIComponent($scope.tinymceModel);
        boardManager.submitNewThread(data);
    });

    $scope.$on('new thread submitted',function(event,data){
        if($scope.toggleEditor)
            $scope.toggleEditor(true);
        if(data.success){
            $scope.tinymceModel = "";
            $scope.tinymceText = "";
        }
    });
    $scope.$on('initialize editor',function(event,data){
        let allowNew = parseInt('0000001',2);
        if(data.user >=0){
            $scope.toggleEditor((data.usergroup & allowNew) >0);
            $scope.tinymceModel = (data.usergroup & allowNew) >0 ? '':data.noNew_user;
        }else if(data.usergroup >=0){
            $scope.toggleEditor((data.usergroup & allowNew) >0);
            $scope.tinymceModel = (data.usergroup & allowNew) >0 ? '':data.noNew_usergroup;
        }else{
            $scope.toggleEditor((data.visitor & allowNew) >0);
            $scope.tinymceModel = (data.visitor & allowNew) >0 ? '':data.noNew_visitor;
        }
    });
}]);