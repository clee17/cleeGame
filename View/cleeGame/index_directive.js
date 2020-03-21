app.directive('renderFinish',function($timeout){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            if(scope.$last ===true)
            {
                scope.$emit('renderFinish');
            }
        }
    }
});

/*导航栏按钮*/
app.directive('headButton',function($location,$rootScope){
   return{
       restrict:'E',
       replace:true,
       scope:true,
       template:'<div>{{name}}</div>',
       link:function(scope,element,attr){
           scope.selected = false;
           scope.name = attr.name;
           scope.link = attr.link;
           let path = $location.path();

           scope.select = function(){
               scope.selected = true;
               $rootScope.name = scope.name;
               element.css('color','rgba(155,60,84,1)');
           };


           if(path.lastIndexOf('/') != 0)
               path = path.substring(1,path.lastIndexOf('/'));
           else
               path = path.substring(1);
           if(path.toUpperCase() == scope.name)
               scope.select();
           else if(path=='' && scope.name =='GAME')
               scope.select();
           else
               element.css('color','rgba(221,174,185,1)');


           $rootScope.$on('refreshHeadButtons',function(){
               scope.selected = false;
               element.css('color','rgba(221,174,185,1)');
           });

           element
               .on('mouseenter',function(){
                   if(!scope.selected)
                        element.css('color','rgba(191,94,119,1)');
               })
               .on('mouseleave',function(){
                   if(!scope.selected)
                       element.css('color','rgba(221,174,185,1)');
               })
               .on('click',function(){
                   if(scope.selected || $rootScope.pageTurning)
                       return;
                   $rootScope.pageTurning = true;
                   $rootScope.$emit('refreshHeadButtons',{head:'head'});
                   scope.select();
                   $rootScope.$emit('turnPage',{link:scope.link});
               });
       }
   }
});


app.directive('categoryButtonTop',function($rootScope,$timeout,$location,worksManager){
    return {
        restrict: 'E',
        scope:true,
        template:'<div>{{name[0]}}</div><div>{{name[1]}}</div>',
        link:function(scope,element,attr){
            scope.name = attr.name.split(',');
            scope.color = attr.color;
            scope.selected = false;
            scope.index= attr.index;
            element.css('transition','background 0.1s');
            element.css('color',scope.color);

            scope.select = function(){
                scope.selected  = true;
                $location.search('cat',scope.name[1].toLocaleLowerCase());
                scope.resetPageManager();
                scope.pageManager.selectedStyle.color = 'white';
                scope.pageManager.selectedStyle.border = scope.color+ '1px solid';
                scope.pageManager.selectedStyle.background = scope.color;
                element.css('background',scope.color);
                element.css('color','white');
                scope.requestInfo(scope.index-1);
            };

            let search = $location.search();
            if(search.cat && search.cat==scope.name[1].toLowerCase())
                scope.select();
            else if(!search.cat && scope.name[1] == 'NOVEL')
                scope.select();

            scope.$on('refreshCategoryButtonTop',function(event,data){
                if(data.name != scope.name[1]) {
                    element.css('background', 'white');
                    element.css('color',scope.color);
                    scope.selected = false;
                }
            },true);

            element
                .on('mouseenter',function(){
                    if(scope.selected)
                        return;
                    element.css('background',scope.color);
                    element.css('color','white');
                })
                .on('mouseleave',function(){
                    if(scope.selected)
                        return;
                    element.css('background','white');
                    element.css('color',scope.color);
                })
                .on('click',function(){
                    if(scope.selected)
                        return;
                    if(scope.requesting)
                        return;
                    scope.select();
                    $timeout(function () {
                        $rootScope.$broadcast('refreshCategoryButtonTop',{name:scope.name[1]});
                    }, 5);
                });
        }
    }
});

app.directive('categoryButtonBottom',function($rootScope,$timeout,$location){
    return {
        restrict: 'E',
        scope:true,
        template:'<span>{{content.subType}}</span>',
        link:function(scope,element,attr){
            scope.selected = false;
            element.css('transition','background 0.1s');

            scope.select = function(){
                scope.selected  = true;
                $location.search('chapter',scope.content.index);
                element.css('background',scope.pageColor);
                element.css('color','white');
                scope.onSubChoose(scope.content.index);
            };

            if(scope.subIndex == scope.content.index)
                scope.select();

            scope.$on('refreshCategoryButtonBottom',function(event,data){
                if(data.index != scope.content.index) {
                    element.css('background', 'white');
                    element.css('color','rgba(126,126,126,1)');
                    scope.selected = false;
                }
            },true);

            element
                .on('mouseenter',function(){
                    if(scope.selected)
                        return;
                    element.css('background',scope.pageColor);
                    element.css('color','white');
                })
                .on('mouseleave',function(){
                    if(scope.selected)
                        return;
                    element.css('background','white');
                    element.css('color','rgba(126,126,126,1)');
                })
                .on('click',function(){
                    if(scope.selected)
                        return;
                    if(scope.requesting)
                        return;
                    scope.select();
                    $timeout(function () {
                        $rootScope.$broadcast('refreshCategoryButtonBottom',{index:scope.content.index});
                    }, 5);
                });
        }
    }
});

app.directive('manualSubButton',function($timeout,$rootScope,$location){
    return {
        restrict:'E',
        replace:true,
        scope: true,
        template:'<div><img ng-alt="{{name}}" ng-src="{{link}}" class="manualButton"></div>',
        link:function(scope,element,attr)
        {
            scope.name =attr.name;
            scope.link = '/img/button_'+attr.index.padZero(3)+'.png';
            scope.color=attr.color;
            scope.selected = false;
            scope.manualIndex = parseInt(attr.index);

            scope.select = function(){
               scope.selected= true;
               element.css('box-shadow','0px 0px 8px '+scope.color);
               (element.children()[0]).style.setProperty('filter','brightness(108%)');
               scope.resetAttribute(scope.manualIndex,scope.name,scope.color);
               document.getElementById("manualBoard").style.setProperty('--boardColor',scope.color);
               $location.search('page',scope.manualIndex);
               scope.requestInfo();
            };

            scope.$on('refreshmanualSubButton',function(event,data){
                if(data.index != scope.manualIndex)
                {
                    scope.selected = false;
                    element.css('box-shadow','none');
                    (element.children())[0].style.setProperty('filter','brightness(100%)');
                }
            });

            element
                .on('mouseenter',function(){
                    if(scope.selected)
                        return;
                    element.css('box-shadow','0px 0px 8px '+scope.color);
                    (element.children())[0].style.setProperty('filter','brightness(108%)');
                })
                .on('mouseleave',function(){
                    if(scope.selected)
                        return;
                    element.css('box-shadow','none');
                    (element.children())[0].style.setProperty('filter','brightness(100%)');
                })
                .on('click',function(){
                    if(scope.selected)
                        return;
                    scope.resetSubIndex();
                    $timeout(function () {
                        $rootScope.$broadcast('refreshmanualSubButton',{index:scope.manualIndex});
                    }, 5);
                    scope.select();
                });

            if(scope.manualIndex == scope.index)
                scope.select();
        }
    }
});
