let path = require('path'),
    fs  = require('fs');
    ejs = require('ejs');
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
    host : 'localhost',
    port : 25,
    tls:{
        rejectUnauthorized:false
    }
});


global.__getCountryCode = function(ipData){
    if(ipData.country === '中国')
        return 'CN';
    else
        return 'OTHER';
};

global.__getReaderCode = function(ipData){
    if(ipData.readerLanguage)
        return ipData.readerLanguage.toUpperCase();
    return __getCountryCode(ipData);
};


global.__saveLog = function(logType,logInfo){
    if (typeof logInfo !== 'string')
        logInfo = JSON.stringify(logInfo);
    fs.appendFile(__basedir + '/log/'+logType+'.log', Date.now().toString() + '_____' + logInfo, function (err, result) {

    });
};

global.__sendMail = function(mailContents,userMail,title){
    var options = {
        from        : '"cleeArchive admin" <no-replay@archive.cleegame.com>',
        to          : ' <'+userMail+'>',
        subject        : title || '感谢使用cleeArchive',
        html           : mailContents,
    };

    mailTransport.sendMail(options,function(err,result){
        if(err) {
            if (typeof err !== 'string')
                err = JSON.stringify(err);
            __saveLog('mail',err);
        }
    });
};

global.__getDateInfo = function(cc,date){
    let timeStamp = date || Date.now();
    let info = new Date(timeStamp);
    let dateInfo = {
        year:info.getFullYear(),
        month: info.getMonth(),
        date:info.getDate(),
        hour: info.getHours(),
        time:info.getTime(),
        seconds: info.getSeconds()
    }
    let dateline = {
        'CN':'<%- year %>年<%- month %>月<%- date %>日 <%- hour %>:<%- time %>:<%- seconds %>',
        'EN':'<%- year %>/<%- month %>月<%- date %>日 <%- hour %>:<%- time %>:<%- seconds %>',
        'OTHER':'<%- year %>年<%- month %>月<%- date %>日 <%- hour %>:<%- time %>:<%- seconds %>',
    };
    return ejs.render(dateline,dateInfo);
};

global.__processMail = function(mailId,receiver,data,countryCode){
    if(!receiver)
        return;
    let mailName = mailId.toString();
    while(mailName.length <3)
        mailName = '0'+mailName;
    let renderData = data || {};
    let cc = countryCode || 'en';
    mailName += '_'+cc.toLowerCase();
    fs.readFile(path.join(__routes,'archive/mail/'+mailName+'.html'),{encoding:'utf-8'},function(err,mailContents){
        if(err){
            __saveLog('mail',Date.now().toString()+'____mail templates read failed____'+JSON.stringify(err));
            return;
        }
        mailContents = ejs.render(mailContents, renderData);
        let mailTitle = null;
        let titleIndex = mailContents.indexOf('<title>');
        if(titleIndex >=0){
            mailTitle = mailContents.substring(titleIndex,mailContents.indexOf('</title>'));
            mailTitle = mailTitle.substring(mailTitle.indexOf('<title>')+7);
            mailContents = mailContents.substring(mailContents.indexOf('</title>')+8);
        }
        __sendMail(mailContents,receiver,mailTitle);
    });
};

global.__multiLang = function(str,ipData){
    if(str.substring(0,6).toLowerCase() === "multil"){
        str = str.substring(6);
        try{
            str = JSON.parse(str);
        }
        catch(err){
            return 'unknown error happened';
        } 
        let cc = __getReaderCode(ipData);
        if(str[cc])
            return str[cc];
        else
            return str['DEFAULT'];
    }else
        return str;
};

global.__packMultiLang = function(llist){
    if(typeof llist !== 'object'){
        let obj = {};
        obj.DEFAULT = llist;
        return'multil'+JSON.stringify(obj);
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
        return 'multil'+JSON.stringify(obj);
    }
};

module.exports = global;

