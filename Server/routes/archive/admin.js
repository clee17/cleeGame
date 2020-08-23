let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'),
        tagModel = require(path.join(__dataModel,'cleeArchive_tag'))),
    updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates'));

let registerModel = require(path.join(__dataModel,'register'));
let userModel = require(path.join(__dataModel,'user'));
let applicationModel = require(path.join(__dataModel,'application'));
let tableIndex = [registerModel,userModel];
let countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));

let userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    getTable:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let pageId = receivedData.pageId || 0;
        let perPage = receivedData.perPage || 30;
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

        if(req.session.user && req.session.user.userGroup >= 99)
        {
            let index = Number(receivedData.name);
            if(index >= tableIndex.length || index <0)
            {
                data.message='暂不提供该表的管理功能';
                finalSend();
            }

            tableIndex[index].find({},null,{skip:pageId*perPage,limit:perPage,sort:{_id: -1}}).exec()
                .then(function(docs){
                    data.contents = JSON.parse(JSON.stringify(docs));
                    data.success = true;
                    finalSend();
                })
                .catch(function(err){
                    data.message = err;
                    finalSend();
                })
        }
        else
        {
            data.message='你没有查看该页面的权限';
            finalSend();
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

        if(req.session.user && req.session.user.userGroup >= 999)
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


    getRegister:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            message:'',
            success:false
        };

        let pageId = receivedData.pageId;
        let perPage = receivedData.perPage;

        if(!req.session.user || req.session.user.userGroup < 999)
            response.message = '您没有相应的权限';

        if(response.message !== '')
            handler.finalSend(res,response);



        applicationModel.find({type:receivedData.type},{},{skip:pageId*perPage,limit:perPage,sort:{subType:1}},function(err,docs){
            if(err)
                response.message = err;
            else if(docs)
                response.contents = JSON.parse(JSON.stringify(docs));
            if(response.message === '')
                response.success = true;
            handler.finalSend(res,response);
        });
    },

    answerRegister:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            message:'',
            success:false
        };

        if(!req.session.user || req.session.user.userGroup < 999)
            response.message = '您没有相应的权限';

        if(response.message !== '')
            handler.finalSend(res,response);


        applicationModel.findOneAndUpdate({_id:receivedData.item._id},
            {status:receivedData.status,subType:receivedData.subType},
            {new:true},
            function(err,doc){
                if(err)
                    response.message = err;
                else if(doc)
                    response.contents = JSON.parse(JSON.stringify(doc));
                if(response.message === '')
                    response.success = true;
                if(response.success && doc.status === 1){
                    let id = doc._id.toString();
                    let mailContents = '<h1 style="color:rgba(158,142,166,255);">感谢您加入cleeArchive，您已经通过审核</h1>'+
                        '<p>接下来您可以前往<a href="archive.cleegame.com/register/'+id+'">archive.cleegame.com/register/'+id+'</a>页面完成注册，如果无法直接跳转该链接，请复制到浏览器中打开</p>';
                    __sendMail(mailContents,doc.mail);
                }else if(response.success && doc.status === 2){
                    let mailContents = '<h1 style="color:rgba(158,142,166,255);">感谢您申请cleeArchive，非常抱歉我们暂时无法通过您的申请</h1>'+receivedData.statements;
                    __sendMail(mailContents,doc.mail);
                }

                if(!err && doc){
                    countMapModel.findOneAndUpdate({infoType:201},{$inc:{number:-1},function(err,data){
                        if(err)
                            console.log(err);
                        }});

                    applicationModel.updateMany({subType:{$gte:doc.subType,$lt:9999}},{$inc:{number:-1}},function(err,doc){
                        if(err)
                            console.log(err);
                    });
                }
                handler.finalSend(res,response);
            });
    },

    addApplication:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            message:'',
            success:false
        };

        if(!req.session.user || req.session.user.userGroup < 999 || req.session.user.settings.access.indexOf(202) === -1)
            response.message = '您没有相应的权限';

        if(response.message !== '')
            handler.finalSend(res,response);

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

    }

};

module.exports = handler;