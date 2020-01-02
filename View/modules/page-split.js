let pageSplit = angular.module('page-split', []);

pageSplit
    .factory('pageSplitter', function () {
        let pageSplitter = (function(){
            let pageSplitter = {
                pageTotal:1,
                entryPerPage:15,
                totalCount:0,
                pageIndex:1,
                indexStep:7,
                name:'',
                class: 'FooterPage',
                selectedStyle:{
                    fontSize:'1.5rem',
                    color:"rgba(221,174,185,1)",
                    fontWeight:'bold'
                },
                unSelectStyle:{
                    fontSize:'1.5rem',
                    color:'rgba(190,150,124,1)',
                },

                reset:function(nppage,pi,is,totalp,totalc){
                    pageSplitter.entryPerPage = nppage || 15;
                    pageSplitter.pageIndex = pi || 1;
                    pageSplitter.pageTotal = totalp || 1;
                    pageSplitter.totalCount = totalc ||0;
                    pageSplitter.indexStep = is || 7;
                    pageSplitter.selectedStyle = {
                        fontSize:'1.5rem',
                        color:"rgba(221,174,185,1)",
                        fontWeight:'bold'
                    };
                    pageSplitter.unSelectStyle={
                        fontSize:'1.5rem',
                        color:'rgba(190,150,124,1)',
                    };
                },
                getPageIndex:function(){
                    let current = pageSplitter.pageIndex;
                    let start = current-3;
                    if(start<1)
                        start=1;
                    let end = start+pageSplitter.indexStep-1;
                    if(end> pageSplitter.pageTotal)
                        end = pageSplitter.pageTotal;
                    let index = [];
                    while(start <= end)
                    {
                        index.push(start);
                        ++start;
                    }
                    return index;
                },

                setPageIndex:function(index)
                {
                   pageSplitter.pageIndex = index || pageSplitter.pageIndex;
                },

                setPageLimit:function(count)
                {
                    if(count && count.constructor==Number)
                        pageSplitter.entryPerPage = count;
                    else
                        console.log('pageSplitter-'+pageSplitter.name+'setPageLimit-parameter is not a number');

                },

                setName:function(name){
                    if(name && name.constructor == String)
                        pageSplitter.name = name;
                    else
                        console.log('pageSplitter-'+pageSplitter.name+'setName-parameter is not a String');
                },

                refreshPageInfo: function(countTotal,limit){
                    pageSplitter.totalCount = countTotal || pageSplitter.totalCount;
                    pageSplitter.entryPerPage = limit || pageSplitter.entryPerPage;
                    pageSplitter.pageTotal = parseInt(pageSplitter.totalCount/pageSplitter.entryPerPage);
                    if(pageSplitter.totalCount%pageSplitter.entryPerPage != 0)
                        pageSplitter.pageTotal++;
                }
            };
            return pageSplitter;
        })();

        return pageSplitter;
    });



/*用于分页的按钮，通用*/
pageSplit.directive('pageButton',function(newsManager){
    return{
        restrict: 'AE',
        replace: true,
        template:'<div class="pageButtonUnSelected">{{value}}</div>',
        link:function(scope,element,attr){
            scope.value = attr.value;
            let pm = scope.pageManager;
            element.toggleClass(pm.class,true);
            if(scope.value == pm.pageIndex)
            {
                element.css(pm.selectedStyle);
            }
            else
            {
                element.css(pm.unSelectStyle);
            }
            element
                .on('mouseenter',function(){
                    if(scope.value == pm.pageIndex)
                        return;
                    element.css(pm.selectedStyle);
                })
                .on('mouseleave',function(){
                    if(scope.value == pm.pageIndex)
                        return;
                    element.css(pm.unSelectStyle);
                })
                .on('click',function(){
                    if(pm.pageIndex == scope.value)
                        return;
                    if(scope.requesting)
                        return;
                    scope.requesting = true;
                    pm.pageIndex = scope.value;
                    $location.search('page',scope.value);
                    scope.refreshPage()
                });
        }
    }
});