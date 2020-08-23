var path = require('path');
let aRedis = require("async-redis"),
    nodeMailer=require('nodemailer');

global.__basedir = path.join(path.resolve(__dirname),'../');

global.__view = path.join(path.join(__basedir,'/View/'));
global.__routes = path.join(path.join(__basedir,'/Server/routes/'));
global.__utils = path.join(path.join(__basedir,'/js/Utility/'));
global.__templates = path.join(path.join(__basedir,'/public/html/templates'));

global.__dataSchema = path.join(path.join(__basedir,'/data/schema/'));
global.__dataModel = path.join(path.join(__basedir,'data/model/'));
global.__dataConnec = path.join(path.join(__basedir,'/data/connectors/'));
global.__dataFormat = path.join(path.join(__basedir,'/data/dataProcessor/'));

global.__game = path.join(path.join(__basedir,'/Directory/'));
global.__entryFile = ['index.html'];

global.__allowedIP = ['180.174.9.230','114.87.146.69','116.238.30.251','114.82.11.15'];

let redis = require('redis');
global.redisClient = redis.createClient();
global.asyncRedis = aRedis.createClient();

let mailTransport = nodeMailer.createTransport({
    host : 'smtp.office365.com',
    port : 587,
    secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
    auth : {
        user : 'cleegame@outlook.com',
        pass : 'Qjlcj1989.*'
    }
});


global.__getCountryCode = function(ipData){
    if(ipData.country === '中国')
        return 'CN';
    else
        return 'OTHER';
};

global.__updateUserSetting = function(applicationId){

};

global.__getDateInfo = function(date){
    let timeStamp = date || Date.now();
    let info = new Date(timeStamp);
    return info.getFullYear()+'年'+(info.getMonth()+1) + '月'+ info.getDate()+'日'+info.getHours()+'时'+info.getMinutes()+'分';
};

global.__sendMail = function(mailContents,userMail,title){
    var options = {
        from        : '"cleegame admin" <cleegame@outlook.com>',
        to          : ' <'+userMail+'>',
        subject        : title || '感谢使用cleeArchive',
        html           : mailContents,
    };

    mailTransport.sendMail(options,function(err,result){
        if(err)
           console.log(err);
        else
            console.log(result);
    });
};

global.__multiLang = function(str,ipData){
    if(str.substring(0,6).toLowerCase() === "multil"){
        str = str.substring(6);
        str = JSON.parse(decodeURIComponent(str));
        let cc = __getCountryCode(ipData);
        if(str[cc])
            return str[cc];
        else
            return str['DEFAULT'];
    }else
        return str;
}

global.__packMultiLang = function(llist){
    if(typeof llist !== 'object'){
        let obj = {};
        obj.DEFAULT = llist;
        return encodeURIComponent('multil'+JSON.stringify(obj));
    }else{
        let obj = {};
        let configured = false;
        let firstItem = "";
        for (let attr in llist){
            obj[attr.toUpperCase()] = llist[attr];
            if(firstItem === "")
                firstItem = obj[attr.toUpperCase()];
            if(attr.toUpperCase() === 'DEFAULT')
                configured = true;
        }
        if(!configured)
            obj.DEFAULT = obj['EN'] || firstItem;
        return  encodeURIComponent('multil'+JSON.stringify(obj));
    }
}

module.exports = global;

