app.directive('waitingAnim',function(){
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="sk-circle-bounce"><div class=\'sk-child sk-circle-1\'></div><div class=\'sk-child sk-circle-2\'></div><div class=\'sk-child sk-circle-3\'></div>\n' +
            '<div class=\'sk-child sk-circle-4\'></div><div class=\'sk-child sk-circle-5\'></div><div class=\'sk-child sk-circle-6\'></div><div class=\'sk-child sk-circle-7\'></div>\n' +
            '<div class=\'sk-child sk-circle-8\'></div><div class=\'sk-child sk-circle-9\'></div><div class=\'sk-child sk-circle-10\'></div><div class=\'sk-child sk-circle-11\'></div>\n' +
            '<div class=\'sk-child sk-circle-12\'></div></div>',
        link:function(scope,element,attr){
            element.css('width','2em');
            element.css('height','2em');
        }
    }
});