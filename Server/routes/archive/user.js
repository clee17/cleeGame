let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let registerModel = require(path.join(__dataModel,'register')),
    userModel = require(path.join(__dataModel,'user')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting')),
    msgModel = require(path.join(__dataModel,'cleeArchive_msgPool'));

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
        let query = req.query;
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
                __renderIndex(req,res,{viewport:'/dynamic/users/'+userId,title:response.userInfo.user+'的主页',controllers:['/view/cont/dashboard_con.js'],styles:['archive/user'],services: ['/view/cont/userService.js'],variables:{userId:response.userInfo._id,readerId:readerId,query:query}});
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
    },

    requestDashboard:function(req,res){
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent =false;
        let response = {
            success:false,
            message:'dashboardRequestFinished',
            info:''
        };

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        let validateUserId = data.userId && __validateId(data.userId);

        if(!validateUserId)
        {
            response.info = '不是有效的用户ID。';
            finalSend();
        }

        if(!data.pageId)
            handler.requestUpdates(req,res,data,response);
        else if(data.pageId==1000)
            handler.requestWorkboard(req,res,data,response);
        else if(data.pageId == 1005)
            handler.requestRecommendationBoard(req,res,data,response);
        else if(data.pageId==1015)
            handler.requestTranslationBoard(req,res,data,response);
        else if(data.pageId == 1020 )
            handler.requestClassificationBoard(req,res,data,response);
        else if(data.pageId == 1025)
            handler.requestTagBoard(req,res,data,response);
        else
            {
                response.info = '查询参数错误';
                finalSend();
            }
    },

    requestUpdates:function(req,res,data,response){
        let result = [];
        let sent = false;
        if(!data.pageId)
            data.pageId = 0;
        let sendError = function(msg){
            if(sent)
                return;
            sent = true;
            response.info = msg;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };
        msgModel.countDocuments({publisher:data.userId,type:{$lt:110}}).exec()
            .then(function(reply){
                if(reply === 0) {
                    response.result = [];
                    response.success = true;
                    finalSend();
                    throw {success:true,msg:'no need for action'};
                }
                else
                {
                    return msgModel.find({publisher:data.userId,type:{$lt:110}},null,{sort:{data:-1},limit:20,skip:data.pageId*20}).exec();
                }
            })
            .then(function(replies){
                console.log(' next then entered');
                response.success = true;
                let commandList = new Array(5);
                for(let i=0;i<commandList.length;++i)
                    commandList[i] = [];
                if(replies)
                    replies.forMap(function(item,i,arr){
                        let index = item.type - 100;
                        commandList[index-1].push(item.refer);
                    });
                else
                    throw '没有获取任何记录';
                let  finishedRequest = function(){
                    data.success = true;
                    response.result = JSON.parse(JSON.stringify(result));
                    finalSend();
                };
                let requestResult = function(modelRefer){
                    let model = null;
                    if(modelRefer >= commandList.length)
                    {
                        finishedRequest();
                        return;
                    }
                    switch(modelRefer){
                        case 0:
                            model = worksModel;
                            break;
                        default:
                            break;
                    }
                    if(!model)
                        requestResult(modelRefer+1);
                    else
                        model.find({_id:{$in:commandList[modelRefer]}},function(err,docs){
                            if(err)
                                throw err;
                            docs.forMap(function(item,i,arr){
                                result.forEach(function(resultItem,resultI,resultArr){
                                    if(resultItem.refer == item._id)
                                        resultItem.refer = JSON.parse(JSON.stringify(item));
                                })});requestResult(modelRefer+1);})
                }
                requestResult(0);
            })
            .catch(function(err){
                console.log(err);
                if(err.success)
                    return;
                sendError(err);
            });
    }



};

module.exports = handler;