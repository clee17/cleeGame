const express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let userModel = require(path.join(__dataModel, 'user')),
    registerModel = require(path.join(__dataModel,'user_register')),
    validModel = require(path.join(__dataModel,'valid')),
    queueModel = require(path.join(__dataModel,'application_queue')),
    applicationModel = require(path.join(__dataModel,'application')),
    countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));

let router = express.Router();

let routeHandler = {
    addQueue:function(application){
        queueModel.findOneAndUpdate({application:application._id,type:application.type},{date:Date.now()},
            {upsert:true,setDefaultsOnInsert: true,new:true},
            function(err,queue){
            if(err){
                //CLEE TO BE ADDED;
            }else if(!queue){
                //CLEE TO BE ADDED;
            }
        })
    },

    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    login: function(req,res){
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
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
             userModel.findOne({user: data.user}).populate('register').exec()
                .then(async function (user) {
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
                    req.session.user = JSON.parse(JSON.stringify(user));
                    req.session.user.isAdmin = await __isIdentity('admin',req.session.user);
                    res.cookie('userId',user._id.toString(),{maxAge:7*24*60*60*1000});
                    res.send(lzString.compressToBase64(JSON.stringify(response)));
                })
                .catch(function (err) {
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

    findApplicationWithRegister:function(req,res,response,register){
        if(register && register.user){
            response.alertInfo = _statements[12];
            routeHandler.finalSend(res,response);
            return;
        }
        applicationModel.findOne({register:register._id},function(err,application){
            if(err){
                response.message = err.message;
                routeHandler.finalSend(res,response);
            }
            if(!application){
                let application = new applicationModel();
                application.type = 0;
                application.register = register._id;
                application.statements = register.statements;
                application.save(function(err){
                    let render =  {code:""};
                    if(!err)
                        render.code = application._id;
                     response.alertInfo =  ejs.render(_statements[10], {code:application._id});
                    routeHandler.finalSend(res,response);
                    routeHandler.addQueue(application);
                })
            }else{
                response.alertInfo =  ejs.render(_statements[10], {code:application._id});
                routeHandler.finalSend(res,response);
            }
        })
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

        let register = null;
        let time = Date.now();
        let recentTime = 5*60*1000;
        time -= recentTime;

        registerModel.findOne({mail:receivedData.mail}).exec()
            .then(function(result){
                register = result;
                if(!result){
                    return registerModel.countDocuments({logged:{$gte:time},ip:req.ip}).exec();
                }else{
                    response.message = _errAll[17];
                    response.success = false;
                    res.cookie(receivedData.mail,'true',{maxAge:10*365*24*60*60*1000});
                    routeHandler.findApplicationWithRegister(req,res,response,register);
                    throw 'SEND COMPLETE';
                }
            })
            .then(function(count){
                if(count >= 3){
                    response.message = _errAll[16];
                    routeHandler.finalSend(res,response);
                    throw 'SEND COMPLETE';
                }else{
                    let newRecord= new registerModel();
                    newRecord.mail = receivedData.mail;
                    newRecord.intro = receivedData.statements;
                    newRecord.ip = req.ip;
                    return newRecord.save();
                }
            })
            .then(function(result){
                register = result;
                if(register){
                    let application = new applicationModel();
                    application.type = 0;
                    application.register = register._id;
                    application.statements = register.intro;
                    return application.save();
                }else
                    throw 'something went wrong and the register info cannot be saved. Please contact the administrator';
            })
            .then(function(application){
                response.success = true;
                response.result = application._id;
                response.alertInfo = _statements[11];
                res.cookie(receivedData.mail,'true',{maxAge:10*365*24*60*60*1000});
                __processMail(0,receivedData.mail,application,__getCountryCode(req.ipData));
                routeHandler.finalSend(res,response);
                routeHandler.addQueue(application);
            })
            .catch(function(err){
                if(err === 'SEND COMPLETE')
                    return;
                response.message = 'err';
                routeHandler.finalSend(res,response);
            });
    },

    register:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            success:false,
            message: ''
        };
        userModel.findOne({user:receivedData.user}).exec()
            .then(function(reply){
                if(reply)
                    throw '该用户名已经被注册';
                let newModel = new userModel();
                newModel.user = receivedData.user;
                newModel.pwd = receivedData.pwd;
                newModel.register = receivedData._id;
                newModel.save(async function(err){
                    if(err)
                        throw '注册失败'+err;
                    response.message = '注册成功';
                    response.success = true;
                    req.session.user = JSON.parse(JSON.stringify(newModel));
                    req.session.user.isAdmin = await __isIdentity('admin',req.session.user._id);
                    registerModel.findOneAndUpdate({_id:newModel.register},{user:newModel._id},{new:true},function(err,register){
                        res.cookie('userId',newModel._id.toString(),{maxAge:7*24*60*60*1000});
                        req.session.user.register = register;
                        routeHandler.finalSend(res,response);
                    })
                });
            })
            .catch(function(err){
                response.message = err.message || err;
                response.success = false;
                routeHandler.finalSend(res,response);
            });
    },

    resetPwd:function(req,res,user,response){
        validModel.deleteMany({type:0,user:user._id}).exec()
            .then(function(results){
                let newValid = new validModel();
                newValid.type = 0;
                newValid.user = user._id;
                return newValid.save();
            })
            .then(function(valid){
                if(!user.register){
                    response.success = false;
                    response.message = _errAll[21];
                    routeHandler.finalSend(res,response);
                    return;
                }
                __processMail(12,user.register.mail,
                    {link:'https://archive.cleegame.com/password_reset/'+valid._id},
                    __getReaderCode(req.ipData));
                response.success = true;
                routeHandler.finalSend(res,response);
            })
            .catch(function(err){
                response.message= err.message;
                response.success = false;
                routeHandler.finalSend(res,response);
            })

    },

    resetPwdUser:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success:false,
            message: '',
            sent:false,
        };

        if(!receivedData._id)
            response.message = '该用户信息不存在';
        else if(!__validateId(receivedData._id))
            response.message = '请提供有效的用户ID';
        if(response.message !== ''){
            routeHandler.finalSend(res,response);
            return;
        }

        userModel.findOne({_id:receivedData._id},function(err,user){
            if(err){
                response.message= err.message;
                routeHandler.finalSend(res,response);
            }else{
                routeHandler.resetPwd(req,res,user,response);
            }
        }).populate('register');
    },


    resetPwdMail:function(req,res){
        let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            success:false,
            message: ''
        };

        registerModel.findOne({mail:received.mail},function(err,register){
            if(err){
                response.message = err.message;
                routeHandler.finalSend(res,response);
            }else if(!register){
                response.message = _errAll[18];
                routeHandler.finalSend(res,response);
            }else if(register && !register.user){
                response.message = _errAll[19];
                routeHandler.finalSend(res,response);
            }else if(register && register.user) {
                let user = JSON.parse(JSON.stringify(register.user));
                user.register = register;
                routeHandler.resetPwd(req,res,user,response)
            }else{
                response.message = 'unknown error';
                routeHandler.finalSend(res,response);
            }
        }).populate('user');
    },


    resetPwdPage:function(req,res){
        let resetId = req.params.resetId;
        if(!__validateId(resetId)){
            __renderError(req,res,_errAll[0]);
        }
        validModel.findOne({_id:resetId},function(err,doc){
            if(err)
                __renderError(req,res,err);
            else if(!doc)
                __renderError(req,res,_errAll[1]);
            else if(doc)
                __renderIndex(req,res,{
                    viewport:'/statement/resetPwd',
                    controllers:['/view/cont/userEdit_con.js'],
                    services:['/service/userService.js'],
                    variables:{requestId:resetId,userId:doc.user}});
        })
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
            routeHandler.finalSend(res, data);
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
        registerModel.findOneAndUpdate({_id:req.session.user.register}, {intro:receivedData.intro},{new:true},function(err,doc){
            if(doc){
                response.intro = doc.intro;
                req.session.user.register.intro = doc.intro;
                response.success = true;
            }
            routeHandler.finalSend(res,response);
        });
    },

    getStatus:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            registered:false,
            position:1,
            success: false,
            message: '',
            sent: false,
        };

        if(!receivedData.id){
            response.message = '没有收到邮箱地址';
        }

        if(response.message !== ''){
            routeHandler.finalSend(res,response);
            return;
        }

        let application = null;

        applicationModel.findOne({_id:receivedData.id})
            .then(function(result){
                application = result;
                if(!application){
                    throw 'There is no record for your application, please contact the administrator.';
                }else{
                    response.result = application.result;
                    response.requestId = application._id;
                    response.register = application.register;
                    response.time = application.date;
                    response.statements = application.statements;
                    routeHandler.success = true;
                    if(application.result >= 1){
                        userModel.findOne({register:application.register},function(err,user){
                            if(user)
                                response.registered = true;
                            response.success = true;
                            response.message = 'The application has been completed';
                            routeHandler.finalSend(res,response);
                        });
                        throw 'SEND COMPLETE';
                    }else{
                        return queueModel.findOne({application:application._id}).exec();
                    }
                }
            })
            .then(function(queue){
                response.success = true;
                let condition = {};
                if(queue)
                  condition = {date:{$lt:queue.date},type:0};
                else
                    routeHandler.addQueue(application);
                queueModel.countDocuments(condition,function(err,count){
                    response.position += count;
                    response.success = true;
                    routeHandler.finalSend(res,response);
                });
            })
            .catch(function(err){
                if(err === 'SEND COMPLETE')
                    return;
                response.message = err;
                response.success = false;
                routeHandler.finalSend(res,response);
            })
    },

    savePwd:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
        };

        if(!receivedData._id)
            response.message = '申请重设时没有提供用户信息，请联系管理员';
        else if(!receivedData.requestId)
            response.message = '修改链接信息丢失，请刷新页面';
        else if(!receivedData.info || receivedData.info === '')
            response.message = '新的密码不符合格式';

        if(response.message !== '')
            routeHandler.finalSend(res,response);

        validModel.findOneAndDelete({_id:receivedData.requestId},function(err,doc){
            if(err)
                response.message = err;
            else if(!doc)
                response.message = '您的用户链接已失效';
            else{
                userModel.findOneAndUpdate({_id:receivedData._id},{pwd:receivedData.info},{new:true},function(err,doc){
                    if(err)
                        response.message = err;
                     if(!doc)
                        response.message = '不存在该用户';
                     if(response.message === '')
                        response.success = true;
                     routeHandler.finalSend(res,response);
                });
            }
            if(response.message !== '')
               routeHandler.finalSend(res,response);
        });
    }
};


router.post('/login',routeHandler.login);
router.post('/logout',routeHandler.logout);
router.post('/register',routeHandler.register);
router.post('/registerRequest',routeHandler.requestRegister);
router.post('/resetPwdUser',routeHandler.resetPwdUser);
router.post('/resetPwdMail',routeHandler.resetPwdMail)
router.get('/password_reset/:resetId',routeHandler.resetPwdPage);
router.post('/checkUsername',routeHandler.checkUser);
// router.post('/apply',routeHandler.apply);
router.post('/saveInfo',routeHandler.saveInfo);
router.post('/requestBill',routeHandler.requestBill);
router.post('/getStatus',routeHandler.getStatus);

router.post('/save/pwd',routeHandler.savePwd);

module.exports = router;