app.filter('userGroup',function(){
    return function(group){
        if(group === 0)
            return 'general user';
        else if(group >= 99)
            return 'administrator';
    }
});

app.filter('userRegister',function(){
    return function(register){
        if(!register)
            return 'no register info found'
        if(register.user)
            return register.user.user;
        else
            return register.mail+'(not registered)';
    }
})
