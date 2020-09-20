app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
                scope.board_category = JSON.parse(unescape(scope['board_category']));
                scope.newThread_category = scope.board_category[0];
                scope.totalNum = Number(scope.totalNum);
                scope.message_threadlen = unescape(scope.message_threadlen);
                scope.message_title = unescape(scope.message_title);
                scope.message_no_title  = unescape(scope.message_no_title);
                scope.message_nonew_user = unescape(scope.message_nonew_user);
                scope.message_nonew_visitor = unescape(scope.message_nonew_visitor);
                scope.message_blocked_user = unescape(scope.message_blocked_user);
                scope.message_block_date = unescape(scope.message_block_date);
                scope.message_non_registered = unescape(scope.message_non_registered);
                scope.alert_delete_thread = unescape(scope.alert_delete_thread);
                scope.initialize();
        }
    }
});
