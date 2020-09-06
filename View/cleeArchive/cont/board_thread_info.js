app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
            scope.gradeTemplate= [{code:0,refer:scope['grade_0']},{code:1,refer:scope['grade_1']},{code:2,refer:scope['grade_2']}];
            scope.initialize();
        }
    }
});
