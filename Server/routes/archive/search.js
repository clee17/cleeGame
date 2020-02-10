let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4')),
    mongoose = require('mongoose');

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic')),
    updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates')),
    visitorModel = require(path.join(__dataModel,'cleeArchive_userValidate')),
    tagMapModel = require(path.join(__dataModel,'cleeArchive_tagMap'));

let handler = {
    all:function(req,res,next){
        let sent = false;
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let requestType = receivedData.searchType || 1;
        let perPage = receivedData.perPage || 20;
        let pageId = req.query.pageId || 0;
        let maxType = requestType*perPage;
        let response = {
            success:false,
            message:'searchFinished',
            searchType:requestType,
            info:''
        };

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
        let likeModelMatch = {$match:{$and:[{$expr:{$eq:["$work","$$work_id"]}},{$expr:{$eq:["$targetUser","$$user_id"]}}],status:1}};
        if(req.session.user)
            likeModelMatch.$match.user = mongoose.Types.ObjectId(req.session.user._id);
        else {
            likeModelMatch.$match.ipa = req.ip;
            delete likeModelMatch.$match.$and;
            likeModelMatch.$match.$expr = {$eq:["$work","$$work_id"]};
        }
        let queryChapter =  [
                {$match:{infoType:1}},
                {$lookup:{from:"work_chapters",as:"chapter",let:{chapterId:"$contents"},pipeline:[
                            {$match:{$expr:{$eq:["$_id","$$chapterId"]},published:true}},
                            {$project:{contents:0}}]}},
                {$unwind:"$chapter"},
                {$lookup:{from:"user", let:{userId:"$chapter.user"},as:"chapter.user",pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$userId"]}}},
                        {$project:{user:1,_id:1}}]}},
                {$unwind:"$chapter.user"},
                {$lookup:{from:"works",as:"work",let:{workId:"$chapter.book"},pipeline:[
                            {$match:{$expr:{$eq:["$_id","$$workId"]},published:true}}
                            ,]}},
                {$unwind:"$work"},
                {$lookup:{from:"post_like", let:{work_id:"$work._id",user_id:"$work.user"},as:"work.feedback",pipeline:[
                        likeModelMatch,
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
                {$lookup:{from:"post_like", let:{work_id:"$work._id",user_id:"$user"},as:"work.feedbackAll",pipeline:[
                        {$match:{$expr:{$eq:["$work","$$work_id"]},status:1,user:{$ne:null}}},
                        {$limit:15},
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
                {$lookup:{from:"work_index", foreignField:"chapter",localField:"chapter._id",as:"index"}},
                {$unwind:"$index"},
            ];

        let queryWork = [
            {$match:{infoType:0}},
            {$lookup:{from:"works",as:"work",let:{workId:"$work"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$workId"]},published:true}},
                    ]}},
            {$unwind:"$work"},
            {$lookup:{from:"post_like", let:{work_id:"$work._id",user_id:"$work.user"},as:"work.feedback",pipeline:[
                        likeModelMatch,
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
            {$lookup:{from:"post_like", let:{work_id:"$work._id"},as:"work.feedbackAll",pipeline:[
                        {$match:{$expr:{$eq:["$work","$$work_id"]},status:1,user:{$ne:null}}},
                        {$limit:15},
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
            {$lookup:{from:"work_index",as:"index",let:{workId:"$work._id"},pipeline:[
                        {$match:{$expr:{$eq:["$work","$$workId"]},order:0}},
                    ]}},
            {$unwind:"$index"},
            {$lookup:{from:"work_chapters",as:"chapter",let:{chapterId:"$index.chapter"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapterId"]}}},
                        {$project:{contents:0}}
                    ]}},
            {$unwind:"$chapter"},
            {$lookup:{from:"user", let:{userId:"$chapter.user"},as:"chapter.user",pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$userId"]}}},
                        {$project:{user:1,_id:1}}]}},
            {$unwind:"$chapter.user"},
            {$set:{date:"$work.date"}},
        ];

        let facet = {};
        facet.fanfic_works = queryWork;
        let union = ["$fanfic_works"];
        if(requestType == 1)
        {
            facet.fanfic_chapters = queryChapter;
            union.push("$fanfic_chapters");
        }
        else if(requestType == 2)
        {
            delete facet.fanfic_works;
            facet.fanfic_chapters = queryChapter;
            union.length = 0;
            union.push("$fanfic_chapters");
        }

        updatesModel.aggregate([
            {$match:{infoType:{$lt:maxType,$gte:maxType-perPage}}},
            {$sort:{date:-1}},
            {$skip:perPage*pageId},
            {$limit:perPage},
            {$facet:facet},
            {$project:{all:{$setUnion:union}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$set:{user:"$publisher"}},
            {$sort:{date:-1}},
            {$lookup:{from:"post_comment", let:{work_id:"$work._id",chapter_id:"$chapter._id",post_type:"$infoType"},as:"commentList",pipeline:[
                        {$match:{$and:[{$expr:{$eq:["$chapter","$$chapter_id"]}},{$expr:{$eq:["$work","$$work_id"]}},{$expr:{$eq:["$infoType","$$post_type"]}}]}},
                        {$sort:{date:-1}},
                        {$limit:15},
                        {$project:{work:0,chapter:0,infoType:0}}]}},
        ]).exec()
            .then(function(docs){
                response.result = JSON.parse(JSON.stringify(docs));
                response.success = true;
                finalSend();
            })
            .catch(function(err){
                console.log (err);
                if(typeof err != String)
                    err = err.errMsg || '不知名的错误';
                response.success = false;
                sendError(err);
            })
    },
};

module.exports = handler;