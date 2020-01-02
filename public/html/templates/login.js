app.directive('mytableRow',['$rootScope',function() {
    return {
        restrict: 'EAC',
        link: function(scope,element,attr) {
            element.css('display','flex');
            element.css('flex-direction','row');
            element.css('margin-top','5px');
            let children = element.children();
            for(var i=0;i<children.length;i++)
            {
                if(children[i].className=='anim')
                    continue;
                children[i].style.setProperty('min-width','5rem');
            }
        }
    };
}]);

app.directive('alertInfo',function(){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            element.html(attr.contents);
        }
    }
});

app.directive('buttonSubmit',function(){
    return {
        restrict: 'E',
        replace:true,
        scope:{
            submit:'&'
        },
        template:'<div>{{submitSign}}</div>',
        link: function(scope,element,attr) {
            scope.submitSign = '提交';

            disableSelect(element);

            element
                .on('mouseenter',function(){
                    element.css('background','rgba(158,142,166,255)');
                    element.css('color','white');
                })
                .on('mouseleave',function(){
                    element.css('color','rgba(158,142,166,255)');
                    element.css('background','white');
                })
                .on('click',function(){
                    scope.submit();
                });
        }
    };
});
