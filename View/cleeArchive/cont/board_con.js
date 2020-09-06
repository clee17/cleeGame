app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
            scope.board_category = JSON.parse(scope['board_category']);
            scope.newThread_category = scope.board_category[0];
            scope.totalNum = Number(scope.totalNum);
            scope.personal_usergroup =  Number(scope.personal_usergroup);
            scope.personal_user =  Number(scope.personal_user);
            scope.personal_visitor =  Number(scope.personal_visitor);
            scope.initialize();
        }
    }
});

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
    }

    $scope.cancelNewthread = function(){
        let element =  document.getElementById("reply_board");
        if(element){
            element.style.opacity = '0';
        }
        $timeout(function(){
            element.style.display = 'none';
        },150)
    }


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
            title:encodeURIComponent($scope.newThread_title)});
    }


    $scope.$on('new thread submitted',function(event,data){
        $scope.cancelSubmitThread();
        if(data.success){
            $scope.newThread_title = "";
            $scope.newThread_grade = '0';
            $scope.threads.push(data.thread);
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