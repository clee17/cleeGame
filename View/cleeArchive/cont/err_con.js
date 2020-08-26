app.directive('errorPanel',function($rootScope){
    return {
        restrict: 'EA',
        link:function(scope,element,attr){
            let err = $rootScope.err;
            if(!err)
                err= window['ERRINFO'];
            err = err.replace(/\n/gi,'<br>');
            err = '<span style="font-weight:bold;color:rgba(158,142,166,255);font-size:1.5rem;">'+err[0]+'</span>'+err.substring(1);
            element.html(err);
        }
    }
});

app.controller("errCon",function($scope){
});