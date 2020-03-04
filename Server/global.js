var path = require('path');
let aRedis = require("async-redis"),
    nodeMailer=require('nodemailer');

global.__basedir = path.join(path.resolve(__dirname),'../');

global.__view = path.join(path.join(__basedir,'/View/'));
global.__routes = path.join(path.join(__basedir,'/Server/routes/'));
global.__utils = path.join(path.join(__basedir,'/js/Utility/'));

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


global.__getCounryCode = function(ipData){
    if(ipData.country === '中国')
        return 'CN';
    else
        return 'OTHER';
};

global.__updateUserSetting = function(applicationId){

};

global.__sendMail = function(mailContents,userMail){
    var options = {
        from        : '"cleegame admin" <cleegame@outlook.com>',
        to          : ' <'+userMail+'>',
        subject        : '感谢申请注册cleeArchive',
        html           : mailContents,
    };
    console.log('entered');

    mailTransport.sendMail(options,function(err,result){
    });
};

module.exports = global;

