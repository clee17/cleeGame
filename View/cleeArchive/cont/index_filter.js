
app.directive('initialisation',['$rootScope',function() {
    return {
        restrict: 'AC',
        link: function($scope) {
            var to;
            var listener = $scope.$watch(function() {
                clearTimeout(to);
                to = setTimeout(function () {
                    listener();
                    $scope.$broadcast('initialisation completed');
                }, 50);
            });
        }
    };
}]);

app.filter('base64', function() { //可以注入依赖
    return function(str,type) {
        if(!str || str.length === 0)
            return str;
        let result = LZString.decompressFromBase64(str);
        if(type && type === 1)
            result = decodeURIComponent(result);
        return result;
    }
});

app.directive('base64',function(){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            let str = element.html();
            if(str.length === 0)
                return;
            str = LZString.decompressFromBase64(str);
            if(str)
                str = str.replace(/\n/g,'<br>');
            element.html(str);
        }
    }
});

app.directive('html',function(){
    return {
        restrict: 'A',
        scope:{
            contents:"@",
        },
        link:function(scope,element,attr){
            let str = scope.contents || element.html();
            element.html(str);
        }
    }
});