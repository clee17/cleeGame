let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'),
        tagModel = require(path.join(__dataModel,'cleeArchive_tag'))),
    updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates'));

let registerModel = require(path.join(__dataModel,'register'));
let userModel = require(path.join(__dataModel,'user'));
let tableIndex = [registerModel,userModel];

let handler = {
    getTable:function(req,res,next){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let pageId = receivedData.pageId || 0;
        let perPage = receivedData.perPage || 30;
        let sent = false;
        let data = {
            message:'',
            success:false
        };
        console.log(receivedData);
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        };

        if(req.session.user && req.session.user.group >= 99)
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

        if(req.session.user && req.session.user.group >= 99)
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

        if(req.session.user && req.session.user.group >= 99)
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
    }
};

module.exports = handler;