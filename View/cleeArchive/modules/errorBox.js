app.directive('errorBox',function($timeout){
    return {
        restrict: 'C',
        scope:{

        },
        link:function(scope,element,attr){
            scope.$on('showErrorText',function(event,data){
                let startFunction = function(){
                    element.html(data);
                    element.css('display','block');
                    element.css('zIndex','99');
                    element.css('transition','transform 1s ease-out');
                    element.css('transform','translateY(-6px)');
                    $timeout(function(){
                        element.css('transition','transform 1s ease-in');
                        element.css('transform','translateY(-100%)');
                    },1000*2);
                };
                if(data)
                       $timeout(startFunction,100);
            });
        }
    }
});
