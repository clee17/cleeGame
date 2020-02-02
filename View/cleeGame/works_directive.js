app.directive('chapterIndex',['chapterManager','$timeout',function(chapterManager){
    return {
        restrict: 'AE',
        template: '<span>{{chap | chapterTitle}}</span>',
        replace: true,
        scope:true,
        link:function(scope,element,attr){
            scope.index = attr.value;
            scope.selected = false;

            let refreshTitle = function(){
                scope.selected = false;
                element.css('color','rgba(126,126,126,1)');
                if(scope.current && scope.current.type===3005 )
                {
                    if(scope.current._id === scope.chap._id)
                    {
                        element.css('color','var(--pageColor)');
                        scope.selected = true;
                    }
                    else if(scope.current.ext4[0]._id === scope.chap._id)
                        element.css('border-left','var(--pageColor) 0.5rem solid');
                    else
                    {
                        element.css('color','rgba(126,126,126,1)');
                        element.css('border-left','none');
                    }
                }
                else if(scope.current && scope.current.type === 3000)
                {
                    if(scope.current._id == scope.chap._id)
                        element.css('border-left','var(--pageColor) 0.5rem solid');
                }
            };

            scope.$watch('current',function(){
                refreshTitle();
            });

            element
                .on('mouseenter',function(){
                    if(scope.chap.type === 3005 && !scope.selected)
                       element.css('color','var(--pageColor)');
                })
                .on('mouseleave',function(){
                    if(scope.chap.type == 3005 && !scope.selected)
                        element.css('color','rgba(126,126,126,1)');

                })
                .on('click',function(){
                    if(!scope.current)
                        return;
                    if(scope.selected)
                        return;
                    if(scope.chap.type == 3000)
                        return;
                    element.css('color','var(--pageColor)');
                    scope.$emit('closePage',{id:element.id});
                    chapterManager.jumpToPage({_id:scope.chap._id});
                });
        }
    }
}]);


app.directive('floatPage',['$rootScope',function($rootScope){
    return {
        restrict: 'A',
        link:function(scope,element,attr){
            scope.$on('closePage',function(event,data){
                var backEle  =  document.getElementById('infoBack');
                element.css('transform-origin','0 '+(3+2.5*attr.pageIndex)+'rem');
                element.css('animation','disappear 0.5s 1');
                element.css('animation-fill-mode','forwards');
                if(backEle)
                {
                    backEle.style.setProperty('animation','fadeOut 0.05s 1');
                    backEle.style.setProperty('animation-delay','0.45s');
                    backEle.style.setProperty('animation-fill-mode','forwards');
                    backEle.style.setProperty('pointer-events','none');
                }
                $rootScope.$broadcast('refreshButtons',{index:attr.pageIndex,anim:'lighten'});
                $rootScope.status = 0;
            })
        }
    }
}]);

app.directive('closeButton',function(){
    return {
        restrict: 'AE',
        replace: true,
        template: '<div class="buttonBg" ><div class="closeButton"></div></div>',
        link:function(scope,element,attr){
            element
                .on('click',function(){
                    scope.$emit('closePage',{id:element.id});
                })
        }
    }
});

app.directive('pageButton',['chapterManager',function(chapterManager){
    return {
        restrict:'AE',
        replace: true,
        scope: true,
        template: '<div>{{text}}</div>',
        link: function(scope,element,attr){
                   scope.text = attr.text;
                   scope.disabled = false;

                   let refreshButtonDisable = function(){
                       if(attr.index == '0' && scope.current && scope.current.prev)
                          scope.disabled = false;
                       else if(attr.index == '1' && scope.current && scope.current.next)
                           scope.disabled = false;
                       else
                           scope.disabled = true;
                       scope.disabled? element.css('color','lightgray'):  element.css('color','rgba(126,126,126,1)');
                   };

                   scope.$watch('current',function(){
                       refreshButtonDisable();
                   });

                   element
                        .on('mouseenter',function(){
                            if(!scope.disabled)
                               element.css('color','lightgray');
                        })
                        .on('mouseleave',function(){
                            if(!scope.disabled)
                               element.css('color','rgba(126,126,126,1)');
                        })
                        .on('click',function() {
                            if(scope.disabled)
                                return;
                            if (attr.index == '0') {
                                chapterManager.prevChapter();
                            } else if (attr.index == '1'){
                                chapterManager.nextChapter();
                            }}
                        );

            refreshButtonDisable();
        }
    }
}]);

app.directive('likeButton',function($rootScope,chapterManager){
    return{
        restrict:'EA',
        template:"<span>{{text+'('+likedCount+')'}}</span>",
        replace:false,
        scope:false,
        link:function(scope,element,attr)
        {
            scope.likedCount = $rootScope.current.liked;
            element.css('transition','color 0.3s');

            let refreshScope = function(){
                if(!$rootScope.current)
                    return;
                scope.selected = $rootScope.ifLiked;
                scope.likedCount = $rootScope.current.liked;
                scope.text = $rootScope.ifLiked? '已喜欢' : '喜欢';
                if (scope.selected)
                {
                    element.css('color','rgba(155,60,84,1)');
                }
                else
                {
                    element.css('color','rgba(126,126,126,1)');
                }
            };

            scope.$watch('current',function(){
                refreshScope();
            },true);

            scope.$on('chapterManagerLikeItError',function(event,data){
                refreshScope();
            });

            element
                .on('mouseenter',function(){
                    if(!scope.selected)
                        element.css('color','rgba(155,60,84,1)');
                })
                .on('mouseleave',function(){
                    if(!scope.selected)
                        element.css('color','rgba(126,126,126,1)');
                })
                .on('click',function(){
                    if(!scope.selected)
                        chapterManager.likeIt();
                    else
                        chapterManager.cancelLike();

                });

            refreshScope();
        }

    }
});


app.directive('likeSymbol',function($rootScope,chapterManager){
    return{
        restrict:'A',
        scope:false,
        link:function(scope,element,attr)
        {
            scope.likedCount = $rootScope.current.liked;
            element.css('transition','color 0.1s');

            let refreshScope = function(){
                if(!$rootScope.current)
                    return;
                scope.selected = $rootScope.ifLiked;
                scope.likedCount = $rootScope.current.liked;
                if (scope.selected)
                {
                    element.css('color','rgba(155,60,84,1)');
                }
                else
                {
                    element.css('color','rgba(126,126,126,1)');
                }
            };

            scope.$watch('current',function(){
                refreshScope();
            },true);

            scope.$on('chapterManagerLikeItError',function(event,data){
                refreshScope();
            });

            element
                .on('mouseenter',function(){
                    if(!scope.selected)
                        element.css('color','rgba(155,60,84,1)');
                })
                .on('mouseleave',function(){
                    if(!scope.selected)
                        element.css('color','rgba(126,126,126,1)');
                })
                .on('click',function(){
                    if(!scope.selected)
                        chapterManager.likeIt();
                    else
                        chapterManager.cancelLike();

                });

            refreshScope();
        }
    }
});