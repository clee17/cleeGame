
let disableSelect = function(ele){
    ele.css('userSelect','none');
    ele.css('webkitUserSelect','none');
    ele.css('msUserSelect','none');
    ele.css('mozUserSelect','none');
};

app.directive('line',function(){
    return {
        restrict: 'E',
        scope: true,
        replace: true,
        template:'<div></div>',
        link: function (scope, element, attr) {
            element.css('wdith',attr.width);
            element.css('height',attr.height);
            element.css('background',attr.color);
        }
    }
});

app.directive('guideButton',function($rootScope){
    return {
        restrict: 'E',
        scope:true,
        replace:true,
        link:function(scope,element,attr){
            element.css('color','white');
            element.css('background','rgba(0,0,0,0)');
            element.css('font-weight','bold');
            element.css('font-family','Microsoft YaHei UI Light');
            element.css('transition','background 0.2s');
            element.css('min-width','4rem');
            element.css('padding-left','25px');
            element.css('padding-right','25px');
            element.css('height','100%');
            element.css('text-align','center');
            element.css('line-height',attr.height);
            disableSelect(element);
            element
                .on('mouseenter',function(){
                    if(scope.selected)
                        return;
                    element.css('background',attr.color);
                })
                .on('mouseleave',function(){
                    if(scope.selected)
                        return;
                    element.css('background','rgba(0,0,0,0)');
                })
                .on('click',function(){
                    if(scope.selected)
                        return;

                });
        }
    }
});

app.directive('expandParent',function(){
    return {
        restrict: 'A',
        scope:{
        },
        controller:function($scope){
            this.changeSwitch = function(){
                $scope.showSub = !$scope.showSub;
                if(this.refreshHideSub)
                   this.refreshHideSub($scope.showSub);
                return $scope.showSub;
            };
        },
        link:function(scope,element,attr,pCtrl){
            scope.showSub = true;
        }
    }
});

app.directive('expandPanel',function(){
    return {
        restrict: 'A',
        require:"^expandParent",
        scope:{},
        link:function(scope,element,attr,pCtrl){
            scope.showSub = true;
            scope.$watch('showSub',function(){
                if(scope.showSub)
                    element.css('display','block');
                else
                    element.css('display','none');
            });

            pCtrl.refreshHideSub = function(condition){
                scope.showSub = condition;
                scope.$apply();
            };
        }
    }
});


app.directive('expandButton',function(){
    return {
        restrict: 'A',
        require:"^expandParent",
        scope:{
        },
        link:function(scope,element,attr,pCtrl){
            scope.switch = true;
            scope.$watch('switch',function(){
                let icon = element.children();
                icon = icon[0];
                var url =  icon.href.baseVal;
                let mark = url.lastIndexOf('-');
                var type = url.substring(mark+1);

                var newType = scope.switch?'down':'up';
                let newLink = url.substring(0,mark+1)+newType;

                icon.href.baseVal = newLink;
                icon.href.animVal = newLink;
            });

            element
                .on('click',function(){
                    if(pCtrl.changeSwitch)
                    {
                        scope.switch = pCtrl.changeSwitch();
                        scope.$apply();
                    }
                });
        }
    }
});


app.directive('floatParent',function(){
    return {
        restrict: 'A',
        scope:{
            value:'='
        },
        controller:function($scope){
            this.changeSwitch = function(){
                if(this.refreshHideSub)
                    this.refreshHideSub();
            };

            this.changeOption = function(newOption, newValue) {
                $scope.value =  Number(newValue);
                if(this.refreshSelect)
                    this.refreshSelect(newOption,newValue);
            };
        },
        link:function(scope,element,attr){
            element.css('position','relative');
        }
    }
});

app.directive('floatPage',function($rootScope,$timeout){
    return {
        restrict: 'AC',
        require:"^floatParent",
        scope:{},
        link:function(scope,element,attr,pCtrl){
            scope.showSub = false;
            scope.freezing = false;
            scope.$on('clicked',function(event,data){
                if(scope.showSub && !scope.freezing)
                {
                    if(!_getInsideTheElement(data.event,_getAbsolutePosition(element[0])))
                    {
                        scope.showSub = !scope.showSub;
                        if(scope.showSub)
                            element.css('display','block');
                        else
                            element.css('display','none');
                    }
                }
            });
            element.css('position','absolute');
            element.css('display','none');
            element.css('background','white');
            element.css('border','solid 1px rgba(181,163,160,218)');
            pCtrl.refreshHideSub = function(){
                scope.freezing = true;
                scope.showSub = !scope.showSub;
                if(scope.showSub)
                    element.css('display','block');
                else
                    element.css('display','none');
                $timeout(function(){scope.freezing = false;},500);
            };
        }
    }
});

app.directive('floatButton',function(){
    return {
        restrict: 'A',
        require:"^floatParent",
        scope:{},
        link:function(scope,element,attr,pCtrl){
            element
                .on('click',function(){
                    if(pCtrl.changeSwitch)
                    {
                        pCtrl.changeSwitch();
                    }
                });
        }
    }
});

app.directive('floatSelectButton',function(){
    return {
        restrict: 'A',
        require:"^floatParent",
        scope:{
        },
        link:function(scope,element,attr,pCtrl){
            pCtrl.refreshSelect = function(newOption,newValue){
                let cleared = false;
                let children = element.children();
                for(let i=0;i<children.length;++i)
                {
                    if(children[i].className=='optionName')
                    {
                        children[i].innerHTML = newOption;
                        cleared = true;
                    }
                }

                let child = element[0].parentNode.lastChild;
                while(child !=null && !cleared)
                {
                    if(child.className && child.className.indexOf('optionName') != -1)
                    {
                        child.innerHTML =newOption;
                        cleared = true;
                    }
                    child = child.previousSibling;
                }
                scope.option = newOption;
                scope.value = newValue || null;
            };
            pCtrl.refreshSelect(attr.currentoption,attr.currentvalue);

            scope.$on('inputHintIni',function(){
                pCtrl.refreshSelect(attr.currentoption,attr.currentvalue);
            });

            element
                .on('click',function(){
                    if(pCtrl.changeSwitch)
                    {
                        pCtrl.changeSwitch();
                    }
                });
        }
    }
});

app.directive('floatSelect',function(){
    return {
        restrict: 'A',
        require:'^floatParent',
        scope:{},
        link:function(scope,element,attr,pCtrl){
            element.css('width','calc(100% - 5px)');
            element.css('height','1.5rem');
            element.css('min-height','1.5rem');
            element.css('line-height','1.5rem');
            element.css('padding-left','5px');
            element.css('font-weight','normal');
            let color = element.css('color');
            disableSelect(element);
            element
                .on('mouseenter',function(){
                    element.css('background','rgba(51,153,255,255)');
                    element.css('color','white');
                })
                .on('mouseleave',function(){
                    element.css('background','white');
                    element.css('color',color);
                })
                .on('click',function(){
                    if(pCtrl.changeSwitch && pCtrl.changeOption)
                    {
                        let value = attr.text || element[0].innerHTML;
                        pCtrl.changeSwitch();
                        pCtrl.changeOption(value,attr.value);
                    }
                });
        }
    }
});

app.directive('buttonStyleA',function($rootScope){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            element.css('background','rgba(0,0,0,0)');
            element.css('border','none');
            element.css('font-weight','bold');
            element.css('font-family',' SimSun-ExtB, Arial, "Microsoft YaHei UI", serif;');
            element.css('transition','background 0.2s');
            element
                .on('mouseenter',function(){
                    element.css('background','rgba(218,218,218,218)');
                })
                .on('mouseleave',function(){
                    element.css('background','rgba(0,0,0,0)');
                });
        }
    }
});

app.directive('buttonStyleB',function($rootScope){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            disableSelect(element);
            element
                .on('mouseenter',function(){
                    element.css('text-decoration','line-through');
                })
                .on('mouseleave',function(){
                    element.css('text-decoration','none');
                });
        }
    }
});