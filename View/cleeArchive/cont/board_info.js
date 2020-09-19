app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
            scope.board_category = JSON.parse(unescape(scope['board_category']));
            scope.newThread_category = scope.board_category[0];
            scope.totalNum = Number(scope.totalNum);
            scope.personal_usergroup =  Number(scope.personal_usergroup);
            scope.personal_user =  Number(scope.personal_user);
            scope.personal_visitor =  Number(scope.personal_visitor);
            scope.initialize();
        }
    }
});
