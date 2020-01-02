app.filter('volumeTitle',function(){
    return function(input, param1) {
        // filter
        if(input && input.index == -1){
            return input.title;
        }
        else if(input && input.type == 3000)
        {
            return '卷'+input.index.toCString()+'  '+input.title;
        }
        else if(input && input.type==3005)
        {
            if(input.ext4[0].index == -1)
            {
                return input.ext4[0].title;
            }
            return '卷'+input.ext4[0].index.toCString()+'   '+input.ext4[0].title;
        }
        else{
            return '';
        };
        return input;
    };
});

app.filter('chapterTitle',function(){
    return function(input,param1) {
        if(input && input.index == -1)
        {
            return input.title;
        }
        else if(input && input.type == 3000)
        {
            return '第'+input.index.toCString()+'卷    '+input.title;
        }
        else if(input && input.type==3005)
        {
            return '第'+input.index.toCString()+'章   '+input.title;
        }
        else{
            return '';
        };
        return input;
    };
});