var express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let userModel = require(path.join(__dataModel, 'user')),
    registerModel = require(path.join(__dataModel,'register'));

let router = express.Router();

let routeHandler = {
    login:function(req,res){
        let data = req.body || null;
        let response = {
            success:false,
            message: ''
        };
        if(!data)
        {
            response.message='没有收到登录数据';
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        }
        if(data) {
            userModel.findOne({user: data.user}).exec()
                .then(function (user) {
                    if (!user) {
                        throw '没有该用户';
                    }
                    if(user && user.pwd != data.pwd)
                    {
                        throw '密码错误';
                    }
                    response.success = true;
                    response.message = '登录成功';
                    req.session.user = user;
                    res.cookie('userId',user._id.toString(),{maxAge:7*24*60*60*1000});
                    res.send(lzString.compressToBase64(JSON.stringify(response)));
                })
                .catch(function (err) {
                    console.log(err);
                    response.message = err;
                    res.cookie('userId','',{maxAge:0});
                    res.send(lzString.compressToBase64(JSON.stringify(response)));
                });
        }
    },

    logout:function(req,res){
        let response = {
            success:true,
            message: ''
        };
        if(req.session.user)
        {
            delete req.session.user;
        }
        else{
            data.message = '您已经登出，请勿反复操作；'
        }
        res.cookie('userId','',{maxAge:0});
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    register:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let response = {
            success:false,
            message: ''
        };
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };
        registerModel.findOne({_id:receivedData._id}).exec()
            .then(function(reply) {
                if (!reply)
                    throw '您的注册链接已经失效';
                else
                    return userModel.findOne({user:receivedData.user});
            })
            .then(function(reply){
                if(reply)
                    throw '该用户名已经被注册';
                let newModel = new userModel();
                newModel.user = receivedData.user;
                newModel.pwd = receivedData.pwd;
               newModel.save(function(err,savedObj){
                   if(err)
                       throw '注册失败'+err;
                   response.message = '注册成功';
                   response.success = true;
                   registerModel.deleteOne({_id: receivedData._id}).exec();
                   finalSend();
               });
            })
            .catch(function(err){
                response.message = err.message || err;
                finalSend();
            });
    },

    checkUser:function(req,res){
        let receivedData = lzString.decompressFromBase64(req.body.data);
        let sent = false;
        let response = {
            success:false,
            message: ''
        };
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        userModel.findOne({user:receivedData}).exec()
            .then(function(reply) {
                if (!reply)
                {
                    response.success = true;
                    response.message = '该用户名可以注册';
                }
                else
                {
                    response.success = false;
                    response.message = '该用户名已被注册';
                }
                finalSend();
            });
    }
};

router.post('/login',routeHandler.login);
router.post('/logout',routeHandler.logout);
router.post('/register',routeHandler.register);
router.post('/checkUsername',routeHandler.checkUser);

module.exports = router;