var express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let userModel = require(path.join(__dataModel, 'user')),
    registerModel = require(path.join(__dataModel,'register')),
    applicationModel = require(path.join(__dataModel,'application')),
    countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));

let router = express.Router();

let routeHandler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        console.log(data);
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

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
                    if(user && user.pwd !== data.pwd)
                    {
                        throw '密码错误';
                    }
                    response.success = true;
                    response.message = '登录成功';
                    response.name = user.user;
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

    applicationProcess:function(doc, ifUpdate){
        let step = ifUpdate? 1 :0;

        let processMail = function(){
            let mailContents =  '<h1>您好，感谢注册CleeArchive！</h1>' +
                '<p><b>您的注册邀请码是：'+doc._id+'</b>，请妥善保管。</p>'+
                '<p>您当前的申请处在第'+doc.subType+'位，管理员每天都会处理一次申请，请耐心等待。</p>';
            __sendMail(mailContents,doc.mail);
        };

        countMapModel.findOneAndUpdate({infoType:201},{$inc:{number:step}},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,result){
            let requestCode = doc._id.toString();
            if(ifUpdate)
                applicationModel.findOneAndUpdate({_id:doc._id},{subType:result.number},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,count){
                    doc.subType = count.subType;
                    processMail();
                });
            else
                processMail();

        });

    },

    requestRegister:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success:false,
            sent:false,
            message: ''
        };
        receivedData.mail = receivedData.mail.toLowerCase();

        receivedData.statements = lzString.compressToBase64(receivedData.statements);

        let addApplication = function(){
            applicationModel.findOneAndUpdate({mail:receivedData.mail,type:0},
                {statements:receivedData.statements,$inc:{count:1}},
                {upsert:true,setDefaultsOnInsert: true,new:true},
                function(err,doc){
                    if(err)
                        response.message = err;
                    else if(!doc)
                        response.message = '没有创建文件';
                    else{
                        response.success = true;
                        response.result = doc._id;
                        res.cookie(receivedData.mail,'true',{maxAge:10*365*24*60*60*1000});
                        let ifUpdate = doc.count<=1;
                        routeHandler.applicationProcess(doc,ifUpdate);

                    }
                    routeHandler.finalSend(res,response);
                });
        };

        userModel.findOne({mail:receivedData.mail},function(err,doc){
             if(doc) {
                 response.message = '该邮箱已被注册';
                 routeHandler.finalSend(res,response);
             }else{
                 addApplication();
             }
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
    },

    apply:function(req,res) {
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        receivedData.user = req.session.user ? req.session.user._id : null;
        receivedData.mail = req.session.user? req.session.user.mail : '';
        if (!receivedData.subType)
            receivedData.subType = 0;
        let response = {
            success: false,
            message: '',
            error:false,
            sent: false,
        };

        if (receivedData.type === 1 && !req.session.user)
            response.error = '创作者权限仅允许注册用户申请';

        if(response.error) {
            handler.finalSend(res, data);
            return;
        }

        applicationModel.findOneAndUpdate({user:receivedData.user,mail:receivedData.mail,type:receivedData.type,subType:receivedData.subType},
            {statements:receivedData.statements, $inc:{count:1}},
            {new:true,upsert:true,setDefaultsOnInsert: true},
            function(err,doc){
                 if(err){
                     response.error = true;
                     response.message = err;
                 }else if(doc.count >1)
                     response.message = '您已经提交过申请，无法重复申请';
                 if(doc)
                     response.applicationId = doc._id;
                 if(!response.error)
                     response.success = true;
                 else
                     routeHandler.finalSend(res,response);
                 if(response.error)
                     return;
                  __updateUserSetting(doc._id.toString(),receivedData,req,function(){
                      routeHandler.finalSend(res,response);
                  });
            });
    },

    requestBill:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            error:false,
            sent: false,
        };
        if (receivedData.type === 1 && !req.session.user)
            response.error = '您的登录状态已过期';

        if(response.error) {
            handler.finalSend(res, data);
            return;
        }

        applicationModel.findOneAndUpdate({user:req.session.user._id,type:2},
            {$inc:{count:1}},
            {new:true,upsert:true,setDefaultsOnInsert: true},
            function(err,doc){
                if(err){
                    response.error = true;
                    response.message = err;
                }else if(doc.count >1)
                    response.message = '您已经提交过申请，请勿反复提交';
                res.cookie('billRequested','true',{maxAge:10*365*24*60*60*1000});
                routeHandler.finalSend(res,response);
            });
    },

    saveInfo:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = JSON.parse(JSON.stringify(receivedData));
        response.sent = false;
        response.sucess = false;

        delete receivedData.type;

        if (!req.session.user)
            response.error = '您的登录状态已过期，请重新登录';

        if(response.error){
            routeHandler.finalSend(res,response);
            return;
        }
        userModel.findOneAndUpdate({_id:req.session.user._id},receivedData,{new:true},function(err,doc){
            if(doc){
                response.mail = doc.mail;
                response.intro = doc.intro;
                req.session.user.mail = doc.mail;
                req.session.user.intro = doc.intro;
                response.success = true;
            }
            routeHandler.finalSend(res,response);
        });
    },

    getStatus:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
        };
        if(!receivedData._id){
            response.message = '没有收到申请码';
        } else if(!__validateId(receivedData._id)){
            response.message = '请输入正确的申请码';
        }
        if(response.message !== ''){
            routeHandler.finalSend(res,response);
            return;
        }
        applicationModel.findOne({_id:receivedData._id},function(err,doc){
            if(err)
                response.message = err;
            else if(doc){
                response.result = doc.status;
                response.subType = doc.subType;
            }
            if(response.message === '')
                response.success = true;
            routeHandler.finalSend(res,response);
        })
    },
};

router.post('/login',routeHandler.login);
router.post('/logout',routeHandler.logout);
router.post('/register',routeHandler.register);
router.post('/registerRequest',routeHandler.requestRegister);
router.post('/checkUsername',routeHandler.checkUser);
router.post('/apply',routeHandler.apply);
router.post('/saveInfo',routeHandler.saveInfo);
router.post('/requestBill',routeHandler.requestBill);
router.post('/getStatus',routeHandler.getStatus);

module.exports = router;