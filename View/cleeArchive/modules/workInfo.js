app.filter('workInfoWordCount',function($filter){
    return function(item,type) {
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        let wc = 0;
        if(subType==0)
             wc = item.work.wordCount;
        else
             wc = item.chapter.wordCount;
        return $filter('wordCount')(wc);
    }
});

app.filter('workInfoTitle', function($filter) { //可以注入依赖
    return function(item,type) {
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return item.work.title;
        else
            return $filter('chapter')(item.index.order) +'     ' + item.chapter.title;
    }
});

app.filter('workInfoLink',function($filter){
    return function(item,type){
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return '/fanfic/work/'+item.work._id;
        else
            return '/fanfic/'+item.chapter._id;
    }
});

app.filter('workInfoVisited',function($filter){
    return function(item,type){
        let workVisited = item.work.visited || 0;
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return workVisited;
        else
            return item.chapter.visited;
    }
});

app.filter('workInfoDate',function($filter){
    return function(item,type){
        let prefix = '更新于:';
        let chapterUpdate = item.updated;
        let subType = item.infoType;
        if(!chapterUpdate && subType == 0)
            chapterUpdate = item.work.updated;
        if(!chapterUpdate)
            chapterUpdate = item.chapter.date;
        if(item.infoType == 1)
            prefix = '增加于:';

        return prefix+ $filter('dateInfo')(chapterUpdate,0);
    }
});

app.filter('workInfoStatus',function(){
    return function(item){
        return item? '连载中':'已完结';
    }
});

app.directive('workInfoOuter',function($compile) {
    return {
        restrict: "C",
        link:function(scope,element,attr){
            if(scope.item.infoType == 0)
            {
                element.css('border','1px solid rgba(181,163,160,218)');
                element.css('box-Shadow','1px solid rgba(181,163,160,218)');
            }
        }
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
                element.css('background','rgba(251,161,0,255)');
            else if(scope.grade == 2)
                element.css('background','rgba(139,100,127,255)');
        }
    }
});

app.directive('workInfo',function($compile,workManager) {
    return {
        restrict: "E",
        templateUrl:'/view/modules/workInfo.html',
        link:function(scope,element,attr){
            scope.type  = Number(attr.type);
            scope.workType = 1;
            if(scope.item.work.chapterCount <= 1 && scope.item.work.status == 0)
                scope.workType = 0;

            scope.type = Number(scope.type && scope.workType);

            scope.deleteItem = function(item){
                console.log(scope.$index);
            }
        }
    }
});