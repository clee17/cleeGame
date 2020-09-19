
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
        scope:{
            'contents':'@',
        },
        link:function(scope,element,attr){
            let str = scope.contents || element.html();
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


app.filter('grade', function() { //可以注入依赖
    return function(code,template) {
        let temp = Number(code);
        for(let i=0;i<template.length;i++)
        {
            if(template[i].code == temp)
                return template[i].refer;
        }
        return '分级模板读取错误';
    }
});


app.directive('gradeShow',function(){
    return {
        restrict: "A",
        scope:{
            grade: '@'
        },
        link: function (scope, element, attr) {
            if(scope.grade  == 1)
                element.css('background','rgba(251,161,0,1)');
            else if(scope.grade == 2)
                element.css('background','rgba(139,100,127,1)');
        }
    }
});


app.filter('dateInfo',function(){
    return function(date,format){
        if(!date)
            return '错误的日期格式';
        let finalDate = new Date(date);
        let year = finalDate.getFullYear();
        let month = finalDate.getMonth()+1;
        let day = finalDate.getDate();
        let hour = finalDate.getHours();
        let min = finalDate.getMinutes();
        let sec = finalDate.getSeconds();
        switch(format){
            case 0:
                return year+'-'+month+'-'+day+'  '+hour+':'+min;
                break;
            default:
                return year+'-'+month+'-'+day+'  '+hour+':'+min+':'+sec;
        }

    }
});
