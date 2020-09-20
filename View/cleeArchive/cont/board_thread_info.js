app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
            scope.gradeTemplate= [{code:0,refer:unescape(scope['grade_0'])},{code:1,refer:unescape(scope['grade_1'])},{code:2,refer:unescape(scope['grade_2'])}];
            scope.alert_delete_thread = unescape(scope.alert_delete_thread);
            scope.message_length = unescape(scope.message_length);
            scope.message_blocked_user = unescape(scope.message_blocked_user);
            scope.message_block_date = unescape(scope.message_block_date);
            scope.message_non_registered = unescape( scope.message_non_registered);
            scope.message_user_blocked = unescape(scope.message_user_blocked);
            scope.message_user_unblocked = unescape(scope.message_user_unblocked);
            scope.message_thread_deleted = unescape(scope.message_thread_deleted);
            scope.message_visitor_noreply = unescape(scope.message_visitor_noreply);
            scope.visitorName = unescape(scope.visitorName);
            scope.info_hidden=unescape(scope.info_hidden);
            scope.initialize();
        }
    }
});
