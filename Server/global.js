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

global.__saveLog = function(logType,logInfo){
    if (typeof logInfo !== 'string')
        logInfo = JSON.stringify(logInfo);
    fs.appendFile(__basedir + '/log/'+logType+'.log', Date.now().toString() + '_____' + logInfo, function (err, result) {

    });
};

global.__updateUserSetting = function(applicationId){

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

global.__getDateInfo = function(date){
    let timeStamp = date || Date.now();
    let info = new Date(timeStamp);
    return info.getFullYear()+'年'+(info.getMonth()+1) + '月'+ info.getDate()+'日'+info.getHours()+'时'+info.getMinutes()+'分';
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
            mailContents = mailContents.substring(mailContents.indexOf('</title>')+8);
        }
        __sendMail(mailContents,receiver,mailTitle);
    });
};

module.exports = global;

