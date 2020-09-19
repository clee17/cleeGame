app.filter('trim', function() { //可以注入依赖
    return function(name) {
        return decodeURIComponent(name);
    }
});

app.controller("board_edit_con",['$scope','$rootScope','$cookies','$location','$timeout','boardManager',function($scope,$rootScope,$cookies,$location,$timeout,boardManager){
    $scope.requesting = false;
    $rootScope.title = LZString.decompressFromBase64($rootScope.title);
    $rootScope.category = JSON.parse(LZString.decompressFromBase64($rootScope.category));
    $scope.newThread_category = $rootScope.category[Number($rootScope.cat)];
    $scope.newThread_grade = $rootScope.grade.toString();

    $scope.cancelSave = function(){
        $scope.requesting = false;
    };

    $scope.getThreadLink = function(){
        let boardRoot = '';
        let boardTitle = $rootScope.board.title;
        if(boardTitle.toUpperCase() === 'NEWS')
            boardRoot =  '/news';
        else
            boardRoot = '/board/'+$rootScope.board._id;
        boardRoot += '/thread/'+$rootScope.threadId;
        if($rootScope.messageType >0){
            boardRoot += '?id='+Math.ceil($rootScope.threadIndex/20);
        }
        return boardRoot;
    };

    $scope.publish = function(){
        if($rootScope.title.length === 0){
            $scope.$emit('showError', $scope['message_no_title']);
            return;
        }else if($scope.title.length < 5){
            let error = $scope['message_title'].replace(/%l/,'5');
            $scope.$emit('showError',error);
            return;
        }
        $scope.requesting = true;
        $scope.$broadcast('publish new thread',{editor_id:'main_editor',
            author:$rootScope.author,
            type:$rootScope.messageType,
            message_id:$rootScope.message_id,
            grade:Number($scope.newThread_grade),
            category:Number($scope.newThread_category.order),
            title:LZString.compressToBase64($rootScope.title)});
    };


    $scope.$on('send new editor contents',function(event,data){
            boardManager.updateMessage(data);
    });

    $scope.$on('message updated',function(event,data){
        if(!data.success){
            $scope.requesting = false;
            $scope.$emit('showError',data.message);
        }else{
           let newLink = $scope.getThreadLink();
           window.location.href = newLink;
        }
    })
}]);


app.controller("TinyMceController",['$scope','$rootScope','$cookies','$location','$timeout',function($scope,$rootScope,$cookies,$location,$timeout){
    $scope.tinymceModel = LZString.decompressFromBase64($rootScope.contents);

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

    $scope.$on('publish new thread',function(event,data){
        if(data['editor_id'] !== $scope.editor_id)
            return;
        if($scope.getPlainText)
            $scope.getPlainText();
        let trueText = $scope.tinymceText.replace(/\s+/g,"");
        if(trueText.length <= 15){
            let text = $scope.$parent['message_length'].replace(/%n/g,15);
            $scope.$emit('showError',text);
            $scope.$parent.cancelSave();
            return;
        }
        data.contents = LZString.compressToBase64($scope.tinymceModel);
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

    $scope.$on('message updated',function(event,data){
        if(!data.success){
            $scope.toggleEditor(true);
        }
    })

}]);