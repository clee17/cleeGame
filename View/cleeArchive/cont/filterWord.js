app.filter('textInfo', function() { //可以注入依赖
    return function(text,noInfo) {
        let noWord = noInfo || '暂无；'
        if(text)
           text = text.replace(/\n/gi,'<br>');
        return text == ''? noWord:text;
    }
});


app.filter('wordCount', function() { //可以注入依赖
    return function(wordCount) {
        if(wordCount < 1000)
            return wordCount.toString();
        else if(wordCount <10000)
            return (wordCount/1000).toFixed(2)+'千';
        else
            return (wordCount/10000).toFixed(2)+'万';
    }
});


app.filter('chapter',function(){
    return function(chapter) {
        if(chapter == 0)
            return "首章";
        else
            return "第"+chapter+"章";
    }
});

app.filter('chapterTitle',function(){
    return function(index) {
        let title = index && index.title ? index.title : "";
        if(index && index.chapter && index.chapter.title)
            title = index.chapter.title;
        if(!index)
            return '[暂无标题]';
        else if(title === '')
            return '[等待命名]';
        else
            return title;
    }
});

app.filter('introType', function() { //可以注入依赖
    return function(info) {
        if(!info || info == '')
            return '作者很懒，什么也没写。';
        else
            return info;
    }
});

app.directive('contentFormat',function($compile){
    return {
        restrict: 'A',
        scope:{
            content:'='
        },
        link:function(scope,element,attr){
            let contents = LZString.decompressFromBase64(scope.content);
            contents = decodeURIComponent(contents);
            contents = contents.replace(/\n/gi,'<br>');
            contents = '<div>'+contents+ '</div>';
            element.append($compile(contents)(scope));
        }
    }
});
