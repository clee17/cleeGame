
app.filter('textInfo', function() { //可以注入依赖
    return function(text) {
        text = text.replace(/\n/gi,'<br>');
        return text == ''? '暂无':text;
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

app.filter('chapter',function(){
    return function(chapter) {
        if(chapter == 0)
            return "首章";
        else
            return "第"+chapter+"章";
    }
});

app.filter('chapterTitle',function(){
    return function(chapter) {
        if(!chapter)
            return '[暂无标题]';
        else if(chapter == '')
            return '[等待命名]';
        else
            return chapter;
    }
});