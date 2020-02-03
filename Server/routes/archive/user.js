let express = require('express'),
    mongoose = require('mongoose'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let registerModel = require(path.join(__dataModel,'register')),
    userModel = require(path.join(__dataModel,'user')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    chapterModel = require(path.join(__dataModel,'cleeArchive_fanfic')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting')),

    tagModel =  require(path.join(__dataModel,'cleeArchive_tag')),
    tagMapModel = require(path.join(__dataModel,'cleeArchive_tagMap')),
    msgModel = require(path.join(__dataModel,'cleeArchive_msgPool'));

let md5 = crypto.createHash('md5');

let handler = {
    register:function(req,res,next){
        let registerId = req.params.registerId;
        let userId = req.session.user;
        if(userId)
            userId = userId._id;
        else
            userId = '';
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
                    variables: {registerId:registerId,loginMode:1},
                    userId:userId
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
                __renderIndex(req,res, {
                    viewport:'/dynamic/users/'+userId,
                    title:response.userInfo.user+'的主页',
                    controllers:['/view/cont/dashboard_con.js'],
                    styles:['archive/user'],
                    modules:['/view/modules/workInfo.js'],
                    services: ['/view/cont/userService.js','/view/cont/filterWord.js','/view/cont/workManager.js'],
                    variables:{userId:response.userInfo._id,readerId:readerId, query:query}});
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
        else if(data.pageId==1010)
            handler.requestSeries(req,res,data,response);
        else if(data.pageId == 1025)
            handler.requestTagBoard(req,res,data,response);
        else
            {
                response.info = '查询参数错误';
                finalSend();
            }
    },

    requestTagBoard(req,res,data,response){
       let pageId = data.subPage || 0;
       let perPage = 10;
       let tagName = data.tagId;
       let sent = false;

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

       if(tagName)
           tagName  = unescape(tagName);
       else
           sendError('不是有效的标签名称');

        if(sent)
            return;
        tagModel.findOne({_id:tagName}).exec()
            .then(function(doc){
                if(!doc)
                    throw '不是有效的标签名称';
                return tagMapModel.aggregate([
                    {$match:{user:mongoose.Types.ObjectId(data.userId),tag:mongoose.Types.ObjectId(doc._id)}},
                    {$lookup:{from:'work_chapters',as:"chapter",let:{chapter_id:"$aid"},pipeline:[
                                {$match:{$expr:{$eq:["$_id","$$chapter_id"]}}},
                                {$project:{contents:0}}
                            ]}},
                    {$unwind: "$chapter" },
                    {$lookup:{from:'works',localField:"chapter.book",foreignField:"_id",as:"work"}},
                    {$unwind: "$work" },
                    {$lookup:{from:'work_index',localField:"chapter._id",foreignField:"chapter",as:"index"}},
                    {$unwind: "$index" },
                    {$facet:{
                            "fanfic_chapter":[
                                {$match:{"work.type":{$lt:100},$or:[{"work.status":1},{"work.chapterCount":{$gt:1}}],"chapter.published":true,infoType:1}},
                                {$set:{updated:"$chapter.date"}},
                            ],
                            "fanfic_works":[
                                {$match:{"work.type":{$lt:100},"index.order":0,"work.published":true,infoType:0}},
                                {$set:{updated:"$work.updated"}}
                            ]
                        }},
                    {$project:{all:{$setUnion:["$fanfic_chapter","$fanfic_works"]}}},
                    {$unwind:"$all"},
                    {$replaceRoot:{newRoot:"$all"}},
                    {$sort:{updated:-1}}
                ]).exec();
            })
            .then(function(docs){
                response.success = true;
                response.maxLimit = docs.length;
                let startIndex = pageId*perPage;
                let endIndex = startIndex + perPage;
                response.result = docs.slice(startIndex,endIndex);
                finalSend();
            })


    },

    requestSeries:function(req,res,data,response){
        response.success = true;
        response.maxLimit = 0;
        response.result = [];
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    requestRecommendationBoard:function(req,res,data,response){
        response.success = true;
        response.maxLimit = 0;
        response.result = [];
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    requestWorkboard:function(req,res,data,response){
        let pageId = data.subPage || 0;
        let perPage = data.perPage || 10;
        let sent = false;
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        let sendError = function(msg){
            if(sent)
                return;
            sent = true;
            response.info = msg;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        if(data.type && data.type == 1)
            response.maxLimit = data.userSetting.workCount.maxChaptersCount || 0;

        worksModel.aggregate([
            {$match:{user:mongoose.Types.ObjectId(data.userId),type:{$lte:10},published:true}},
            {$sort:{updated:-1}},
            {$project:{work:"$$ROOT"}},
            {$set:{infoType:0}},
            {$lookup:{from:'work_index',as:"index",
                    let:{work_id:"$_id"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                        {$project:{contents:0}}
                    ]}},
            {$unwind:"$index"},
            {$lookup:{from:'work_chapters',as:"chapter",
                    let:{work_id:"$_id",chapter_id:"$index.chapter"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapter_id"]}}},
                        {$project:{contents:0}}
                    ]}},
            {$unwind:"$chapter"},
            {$set:{updated:"$work.updated"}}
        ])
            .then(function(docs){
                response.success = true;
                response.maxLimit = docs.length;
                let startIndex = pageId*perPage;
                let endIndex  = startIndex + perPage;
                response.result = docs.slice(startIndex,endIndex);
                finalSend();
            })
            .catch(function(err){
                console.log(err);
                if(err.success)
                    return;
                sendError(err);
            });
    },

    requestUpdates:function(req,res,data,response){
        let sent = false;
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
        if(!data.userId)
            sendError('不是有效的用户ID');
        if(sent)
            return;

        data.userId = mongoose.Types.ObjectId(data.userId);
        response.type = 0;
        if(!data.perPage)
            data.perPage = 10;
        if(!data.pageId)
            data.pageId = 0;
        if(!data.subPage)
            data.subPage = 0;

        response.maxLimit = data.maxMsgCount || 0;

        worksModel.aggregate([
            {$match:{user:data.userId,published:true,type:{$lt:100}}},
            {$facet:{
                "fanfic_chapter":[
                    {$match:{type:{$lt:100},$or:[{status:1},{chapterCount:{$gt:1}}],published:true}},
                    {$project:{work:"$$ROOT"}},
                    {$lookup:{from:"work_chapters", let:{work_id:"$_id"},as:"chapter",pipeline:[
                        {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                        {$project:{contents:0}}]}},
                    {$unwind:"$chapter"},
                    {$set:{updated:"$chapter.date",infoType:1}},
                    {$lookup:{from:"work_index", localField:"chapter._id",foreignField:"chapter",as:"index"}},
                    {$unwind:"$index"}
                ],
                    "fanfic_works":[
                        {$match:{type:{$lt:100}}},
                        {$project:{work:"$$ROOT"}},
                        {$lookup:{from:"work_index", let:{work_id:"$_id"},as:"index",pipeline:[{$match:{$expr:{$eq:["$work","$$work_id"]},order:0}}]}},
                        {$unwind:"$index"},
                        {$lookup:{from:"work_chapters",let:{chapter_id:"$index.chapter"},as:"chapter",pipeline:[{$match:{$expr:{$eq:["$_id","$$chapter_id"]}}},{$project:{contents:0}}]}},
                        {$unwind:"$chapter"},
                        {$lookup:{from:"work_chapters",let:{chapter_id:"$index.chapter"},as:"countChapter",pipeline:[{$match:{$expr:{$eq:["$_id","$$chapter_id"]},published:true}},{$project:{contents:0}}]}},
                        {$set:{updated:"$work.updated",infoType:0}},
                        {$project:{countChapter:0}}
                    ]
                }},
            {$project:{all:{$setUnion:["$fanfic_chapter","$fanfic_works"]}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$sort:{updated:-1}}
            ]).exec()
            .then(function(docs){
                response.success = true;
                response.maxLimit = docs.length;
                let startIndex = data.perPage* data.subPage;
                let result = docs.slice(startIndex,startIndex+data.perPage);
                response.result = JSON.parse(JSON.stringify(result));
                finalSend();
            })
            .catch(function(err){
                console.log(err);
                response.msg = err;
                response.success = false;
                sendError(err);
            })
    },

    calculate:function(req,res){
        let sent = false;
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
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
        let response = {
            success:false,
            result:null,
            message:'userCalculationEnded'
        };

        worksModel.aggregate([
            {$match:{user:mongoose.Types.ObjectId(data.user),published:true,type:{$lt:100}}},
            {$facet:{
                    "fanfic_works":[
                        {$match:{type:{$lt:5}}},
                        {$project:{_id:1}},
                    ],
                    "fanfic_recommendation":[
                        {$match:{type:5}},
                        {$count:"recommendCount"},
                    ],
                    "fanfic_series":[
                        {$match:{type:10}},
                        {$count:"seriesCount"},
                    ]
                }},
        ]).exec()
            .then(function(docs){
                let result = docs[0];
                if(!docs[0])
                    throw '查询结果出错';
                response.result = {};
                response.result.workCount = result.fanfic_works.length;
                response.result.recommendCount = result.fanfic_recommendation.length;
                response.result.seriesCount = result.fanfic_series.length;
                response.success = true;
                finalSend();
            })
            .catch(function(err){
                response.msg = err;
                response.success = false;
                sendError(err);
            })
    }


};

module.exports = handler;