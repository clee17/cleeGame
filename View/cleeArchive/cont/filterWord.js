
app.filter('textInfo', function() { //可以注入依赖
    return function(text) {
        text = text.replace(/\n/gi,'<br>');
        return text == ''? '暂无':text;
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

app.filter('introType', function() { //可以注入依赖
    return function(info) {
        if(!info || info == '')
            return '作者很懒，什么也没写。';
        else
            return info;
    }
});
