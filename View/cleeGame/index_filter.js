app.filter('wordCount',function(){
    return function(input, param1) {
        // filter
        if(input < 10000)
        {
            return input+'字';
        }
        else if(input < 100000000)
        {
            return (input/10000).toFixed(1)+'万字'
        }
        return input+'字';
    };
});

app.filter('chapterCount',function(){
    return function(input, param1) {
        // filter
        if(input < 1000)
        {
            return input+'章';
        }
        else if(input < 10000)
        {
            return (input/1000).toFixed(0)+'千章'
        }
        return input+'章';
    };
});

app.filter('visitParse',function(){
    return function(input, entryType) {
        var suffix='阅读';
        switch(entryType)
        {
            case 2000:
            case 2010:
                suffix='阅读';
                break;
            case 2005:
            case 2015:
                suffix='浏览';
                break;
        }
        if(!input)
            return '';
       if(input<10000)
       {
           return input+suffix;
       }
       else if(input < 100000000)
       {
           return (input/10000).toFixed(2) +'万'+suffix;
       }
       return input+suffix;
    };
});


app.filter('dateFormat',function(){
    return function(input)
    {
        let date = new Date(input);
        return date.toLocaleString();
    }
});

app.filter('trimMaxWord',function(){
    return function(input,param1)
    {
        if(input.length>= param1)
        {
            input = input.slice(0,param1);
            input+= '...';
        }
        return input;
    }
});