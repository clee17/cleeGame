let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'),
        tagModel = require(path.join(__dataModel,'cleeArchive_tag'))),
    updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates'));

let validModel = require(path.join(__dataModel,'valid'));
let userModel = require(path.join(__dataModel,'user'));
let registerModel = require(path.join(__dataModel,'user_register'));
let applicationModel = require(path.join(__dataModel,'application'));
let applicationConversationModel = require(path.join(__dataModel,'application_conversation'));
let queueModel = require(path.join(__dataModel,'application_queue'));
let countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));
let userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let tableIndex ={
    'valid':validModel,
    'queue':queueModel,
    'user':userModel,
    'conversation':applicationConversationModel,
    'application':applicationModel
};

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    sendError:function(res,response,err){
        if(response.sent)
            return;
        if(typeof err != 'string')
            err= JSON.stringify(err);
        response.message=  err;
        response.success = false;
        response.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    validation:function(data,response,req){
        if(!data.name || !tableIndex[data.name]){
            response.message='The table is currently not available for management.';
            return false;
        }

        if(!req.session.user || req.session.user < 99){
            response.message='This page is only limited to Administrators.';
            return false;
        }

        return true;
    },

    clearApplicationQueue:function(user,type,success){
        registerModel.findOne({user:user},function(err,docs){
            if(err){}
            else{}
        })

    },

    aggregate:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let condition = receivedData.condition || null;
        let data = {
            message:'',
            requestId:receivedData.requestId,
            success:false,
            sent:false
        };

        if(!handler.validation(receivedData,data,req)){
            handler.finalSend(res,data);
            return;
        }

        if(!condition){
            data.message = 'cannot aggregate without condition';
            handler.finalSend(res,data);
            return;
        }

        tableIndex[receivedData.name].aggregate(condition)
            .then(function(docs){
                data.contents = docs;
                data.success = true;
                handler.finalSend(res,data);
            })
            .catch(function(err){
                if(typeof err != 'string')
                    err = JSON.stringify(err);
                data.message = err;
                handler.finalSend(res,data);
            });
    },

    getTable:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let populate = receivedData.populate || '';
        let condition = receivedData.condition || {};
        let pageId = receivedData.pageId || 1;
        pageId--;
        let perPage = receivedData.perPage || 30;
        let option = {skip:pageId*perPage,limit:perPage,sort:{_id: -1}};
        if(receivedData.option)
            option = receivedData.option;
        let data = {
            message:'',
            requestId:receivedData.requestId,
            success:false,
            sent:false
        };

        if(!handler.validation(receivedData,data,req)){
            handler.finalSend(res,data);
            return;
        }

        tableIndex[receivedData.name].find(condition,null,option).populate(populate).exec()
            .then(function(docs){
                data.contents = JSON.parse(JSON.stringify(docs));
                data.success = true;
                handler.finalSend(res,data);
            })
            .catch(function(err){
                if(typeof err === 'object')
                   data.message = err.message || JSON.stringify(err);
                else
                    data.message = err;
                handler.finalSend(res,data);
            })
    },

    countRec:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let data = {
            sent:false,
            message:'',
            success:false
        };
        let condition = receivedData.condition || {};

        if(!receivedData.name || !tableIndex[receivedData.name]){
            data.message='The table is currently not available for management.';
            handler.finalSend(res,data);
            return;
        }

        if(!req.session.user || req.session.user < 99){
            data.message='This page is only limited to Administrators.';
            handler.finalSend(res,data);
            return;
        }

        if(receivedData.estimation){
            tableIndex[receivedData.name].estimatedDocumentCount(function(err,count){
                if(!err){
                    data.success = true;
                    data.count = count;
                    handler.finalSend(res,data);
                }else{
                    data.message = err;
                    handler.finalSend(res,data);
                }
            });
        }else{
            tableIndex[receivedData.name].countDocuments(condition,function(err,count){
                if(!err){
                    data.success = true;
                    data.count = count;
                    handler.finalSend(res,data);
                }else{
                    data.message = err;
                    handler.finalSend(res,data);
                }
            });
        }
    },

    addRec:function(req,res,next){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let data = {
            message:'',
            success:false
        };

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        };

        if(req.session.user && req.session.user.userGroup >= 999)
        {
            let index = Number(receivedData.name);
            if(index >= tableIndex.length || index <0)
            {
                data.message='暂不提供该表的管理功能';
                finalSend();
            }

            let newRec = tableIndex[index]();
            newRec.save(function(err,savedObj){
                if(err)
                    data.message = err;
                else if(!savedObj)
                    data.message='添加成功！';
                else{
                    data.contents = JSON.parse(JSON.stringify(savedObj));
                    data.success = true;
                    data.message = '添加失败';
                }
                finalSend();
            });
        }
        else
        {
            data.message='你没有执行该功能的权限';
            finalSend();
        }
    },

    removeRec:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let response = {
            message:'',
            success:false
        };

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        if(req.session.user && req.session.user.userGruop >= 999)
        {
            let index = Number(receivedData.name);
            if(index >= tableIndex.length || index <0)
            {
                response.message='暂不提供该表的管理功能';
                finalSend();
            }

            let model = tableIndex[index];
            model.deleteOne({_id:receivedData._id}).exec()
                .then(function(reply){
                    if(!reply.ok )
                        throw '删除失败';
                    response.success = true;
                    response.index = receivedData.index;
                    finalSend();
                })
                .catch(function(err){
                    response.message = err;
                    finalSend();
                });
        }
        else
        {
            response.message='你没有执行该功能的权限';
            finalSend();
        }
    },

    addAccess:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            message:'',
            success:false
        };

        if(!req.session.user || req.session.user.userGroup < 999 || __isIdentity(202, req.session.user.settings.access))
            response.message = '您没有相应的权限';

        if(response.message !== ''){
            handler.finalSend(res,response);
            return;
        }

        userSettingModel.findOneAndUpdate({user:receivedData.item.user},
            {$push:{access:receivedData.item.subType+100}},
            {new:true},
            function(err,doc){
                if(err)
                    response.message = err;
                else if(doc)
                    response.status  = 1;
                handler.finalSend(res,response);
            });
    },

    approveAccess:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
        };

        if(!receivedData.user || !__validateId(receivedData.user)){
            handler.sendError(res,response,'No valid user info received');
            return;
        }

        if(!receivedData.index || receivedData.index <= 100 || receivedData.index >105 ){
            handler.sendError(res,response, 'No valid authorization code  received');
            return;
        }

        response.index = receivedData.index;
        response.user = receivedData.user;

        userSettingModel.findOneAndUpdate({user:receivedData.user,"access.index":(receivedData.index-100)},{$inc:{"access.$.index":100}},{new:true}).exec()
            .then(function(doc){
                if(!doc){
                    throw 'Please request the authorization first.'
                }
                doc = JSON.parse(JSON.stringify(doc));
                response.success = true;
                response.access =  doc.access;
                handler.clearApplicationQueue(doc.user,index-100,true);
                handler.finalSend(res,response);
            })
            .catch(function(err){
                if(typeof err == 'string')
                    response.message = err;
                else
                    response.messaege = JSON.stringify(err);
                response.success = false;
                handler.finalSend(res,response);
            })
    },

    sendApplicationMail:function(req,response){
        let application = response.result;
        application.attach = response.attach || '';
        application.attach = decodeURIComponent(lzString.decompressFromBase64(application.attach));
        let mail = application.register.mail;
        // 0, reviewing, 1, 注册成功, 2 审核拒绝 3 waitingList
        // 10, writer审核中, 1, 注册成功, 2 审核拒绝 3 waitingList
        let mailId = application.type*10 + application.result;
        if(typeof mailId != 'number')
            mailId = 999;
        let cc = __getCountryCode(req.ipData);
        __processMail(mailId,mail,application,cc);
    },

    approveAccessWithApplication:function(application){
        var userInfo = null;
        registerModel.findOne({_id:application._id}).exec()
            .then(function(register){
                return userModel.findOne({register:register._id}).exec();
            })
            .then(function(user){
                userInfo = user;
                return userSettingModel.findOneAndUpdate( {user:userInfo._id,"access.index":(application.type)},{$inc:{"access.$.index":100}},{new:true}).exec();
            })
            .then(function(result){
                if(!result)
                    throw 'The access grant of user '+userInfo._id+'____'+userInfo.user+' of '+application.type+100+'has failed as we cannot find an access request';
            })
            .catch(function(err){
               __saveLog('cleeArchive_approveAcces',err);
            });
    },

    afterApplication:function(response){
        let application = response.result;
        if(application.type >=1 && application.type <=5 && application.result === 1)
            handler.approveAccessWithApplication(response.result);
    },

    answerApplication:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
            attach:receivedData.attach || ""
        };

        if(!req.session.user || req.session.user.userGroup < 999 || __isIdentity(202, req.session.user.settings.access)){
            handler.sendError(res,response,'No valid application info received');
            return;
        }

        if(!receivedData._id || !__validateId(receivedData._id)){
            handler.sendError(res,response,'No valid application info received');
            return;
        }

        if(receivedData.result === undefined){
            handler.sendError(res,response,'No appication result provided');
            return;
        }

        applicationModel.findOneAndUpdate({_id:receivedData._id},{result:receivedData.result},{new:true}).populate('register').exec()
            .then(function(application){
                if(!application)
                    throw ' no application found in the database';
                response.result = application;
                response.attach = lzString.compressToBase64(response.attach);
                let newConversation = new applicationConversationModel();
                newConversation.application = application._id;
                newConversation.type = application.type;
                newConversation.result = application.result;
                newConversation.contents = response.attach;
                newConversation.from = req.session.user.register;
                return newConversation.save();
            })
            .then(function(coversation){
                response.success = true;
                handler.finalSend(res,response);
                handler.afterApplication(response);
                handler.sendApplicationMail(req,response);
            })
            .catch(function(err){
                console.log(err);
                handler.sendError(res,response,err);
            })
    },

    answerApplicationQueue:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
        };

        if(!req.session.user || req.session.user.userGroup < 999 || __isIdentity(202, req.session.user.settings.access)){
            handler.sendError(res,response,'No valid application info received');
            return;
        }

        if(!receivedData._id || !__validateId(receivedData._id)){
            response.message=  'No valid application info received';
            handler.finalSend(res,response);
            return;
        }

        queueModel.findOneAndDelete({_id:receivedData._id},function(err,result){
            if(err)
                handler.sendError(res,response,err);
            else{
                let application = JSON.parse(JSON.stringify(result.application));
                application.result = receivedData.result;
                application.attach = receivedData.attach;
                req.body.data = lzString.compressToBase64(JSON.stringify(application));
                handler.answerApplication(req,res);
            }
        }).populate('application');

    },


    resendApplication:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            message: '',
            sent: false,
        };

        if(!receivedData._id || !__validateId(receivedData._id)){
            response.message=  'No valid application info received';
            handler.finalSend(res,response);
            return;
        }

        applicationModel.findOneAndUpdate({_id:receivedData._id},{result:0}).populate('register').exec()
            .then(function(application){
                if(!application)
                    throw ' no such application found in database';
                response.application = JSON.parse(JSON.stringify(application));
                return queueModel.findOne({type:application.type},null,{sort:{date:1}}).exec();
            })
            .then(function(queue){
                let newQueue = new queueModel;
                newQueue.application = response.application._id;
                newQueue.type = response.application.type;
                newQueue.date = Date.now();
                if(queue && response.application.result === 3){
                    let firstDate = response.application.date;
                    firstDate = new Date(firstDate);
                    newQueue.date.setSeconds(firstDate.getSeconds() - 5);
                }
                return newQueue.save();
            })
            .then(function(result){
                response.success = true;
                response.application.result = 0;
                response.result = JSON.parse(JSON.stringify(result));
                response.result.application = response.application;
                delete result.application;
                handler.finalSend(res,response);
            })
            .catch(function(err){
                console.log(err);
                handler.sendError(res,response,err);
            })
    }

};

module.exports = handler;