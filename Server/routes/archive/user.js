let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let registerModel = require(path.join(__dataModel,'register')),
    userModel = require(path.join(__dataModel,'user')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let md5 = crypto.createHash('md5');

let handler = {
    register:function(req,res,next){
        let registerId = req.params.registerId;

        let sent = false;
        let success = false;
        let error = '';
        let finalSend = function() {
            if (sent)
                return;
            sent = true;
            if (success)
                __renderIndex(req, res, {
                    viewport: '/view/register.html',
                    controllers: ['/templates/login.js', '/templates/register_con.js'],
                    services: [],
                    variables: {registerId:registerId,loginMode:1}
                });
            else
                __renderError(req, res, error);
        };

        if(req.session.user) {
            error = '您已经登录，无法注册新账号';
            finalSend();
        }

        if(sent)
            return;
        registerModel.findOne({_id:registerId}).exec()
            .then(function(doc){
                if(!doc)
                    throw "不存在该注册链接<br>请检查您的输入。";
                if(Date.now().value - doc.date.value >= 24*60*60*1000)
                    return registerModel.deleteOne({_id:doc._id}).exec();
                else {
                    success = true;
                    finalSend();
                }
            })
            .then(function(reply){
                throw "您的注册链接已经过期。<br>请重新联系管理员申请。";
            })
            .catch(function(err){
                error = err;
                finalSend();
            });
    },

    userPage:function(req,res){
        let userId = req.params.userId;
        let readerId = '';
        if(req.session.user)
            readerId = req.session.user._id;
        let queryId = req.query.id;
        let sent = false;
        let response = {
            success:false,
            userInfo:null,
            message:''
        };
        let finalSend = function(){
            if(sent)
                return;
            if(response.userInfo)
                __renderIndex(req,res,{viewport:'/dynamic/users/'+userId,title:response.userInfo.user+'的主页',controllers:['/view/cont/dashboard_con.js'],styles:['archive/user'],variables:{userId:response.userInfo._id,queryId:queryId,readerId:readerId}});
            else
                __renderError(req,res,response.message);
        };
        userModel.findOne({_id:userId}).exec()
            .then(function(reply){
                if(!reply)
                    throw '不存在该用户';
                response.success = true;
                response.userInfo = JSON.parse(JSON.stringify(reply));
                finalSend();
            })
            .catch(function(err){
                console.log(err);
                response.message = err;
                finalSend();
            })
    },

    saveSetting:function(req,res){
        let settingData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let data = {
            success:false,
            status:200,
            message:''
        };

        if(!req.session.user)
        {
            data.message = '需要重新登录';
            data.status = 503;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        }
        else{
            userSettingModel.findOneAndUpdate({user:req.session.user._id},settingData,{new:true,upsert:true,setDefaultsOnInsert: true},function(err,doc){
                if(err)
                    data.message = err;
                else
                {
                    data.success = true;
                    data.info = JSON.parse(JSON.stringify(doc));
                    req.session.user.settings = JSON.parse(JSON.stringify(doc));
                }
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            })
        }
    }
};

module.exports = handler;