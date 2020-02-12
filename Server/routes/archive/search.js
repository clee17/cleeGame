let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4')),
    mongoose = require('mongoose');

let updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates')),
    countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    all:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let searchList = receivedData.searchList || [0,1];
        let perPage = receivedData.perPage || 20;
        let pageId = receivedData.pageId || 1;
        pageId--;
        let maxType =receivedData.maxInfoType || 10;
        let minType = receivedData.minInfoType || 0;
        let totalNum = receivedData.totalNum || 20;
        let response = {
            sent:false,
            success:false,
            message:'searchFinished',
            searchList:searchList,
            minType:minType,
            maxType:maxType,
            info:''
        };

        if(pageId<0 || pageId >= Math.ceil(totalNum/perPage))
        {
            response.message = '不是有效的页码';
            handler.finalSend(res,response);
            return;
        }

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

        let workDate = "$work.date";
        if(searchList.indexOf(1) === -1)
            workDate = "$work.update";
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
            {$set:{date:workDate}},
        ];

        let facet = {};
        facet.fanfic_works = queryWork;
        let union = [];
        for(let i=0; i<searchList.length;++i){
            switch(searchList[i]){
                case 0:
                {
                    facet.fanfic_works = queryWork;
                    union.push("$fanfic_works");
                }
                    break;
                case 1:
                {
                    facet.fanfic_chapters = queryChapter;
                    if(searchList.indexOf(0) !== -1)
                    {
                        let newItem = {$match:{$or:[{"work.status":{$gt:0}},{"work.chapterCount":{$gt:1}}]}};
                        queryChapter.splice(7,0,newItem);
                    }
                    union.push("$fanfic_chapters");
                }

                    break;
            }
        }

        let sort = {date:-1};
        if(searchList.length === 1 && searchList[0] == 1)
            sort = {update:-1};

        updatesModel.aggregate([
            {$match:{infoType:{$in:searchList}}},
            {$sort:{date:-1}},
            {$facet:facet},
            {$project:{all:{$setUnion:union}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$set:{user:"$publisher"}},
            {$sort:{date:-1}},
            {$skip:perPage*pageId},
            {$limit:perPage},
            {$lookup:{from:"post_comment", let:{work_id:"$work._id",chapter_id:"$chapter._id",post_type:"$infoType"},as:"commentList",pipeline:[
                        {$match:{$and:[{$expr:{$eq:["$chapter","$$chapter_id"]}},{$expr:{$eq:["$work","$$work_id"]}},{$expr:{$eq:["$infoType","$$post_type"]}}]}},
                        {$sort:{date:-1}},
                        {$limit:15},
                        {$project:{work:0,chapter:0,infoType:0}}]}},
        ]).allowDiskUse(true).exec()
            .then(function(docs){
                response.result = JSON.parse(JSON.stringify(docs));
                response.success = true;
                console.log('search finish sent');
                handler.finalSend(res,response);
            })
            .catch(function(err){
                if(typeof err !== 'string')
                    err = err.errMsg || '不知名的错误';
                response.success = false;
                response.message = err;
                console.log(err);
                handler.finalSend(res,response);
            });
    },

    count:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let maxType =receivedData.maxInfoType || 10;
        let minType = receivedData.minInfoType || 0;
        let response = {
            sent:false,
            success:false,
            message:'',
            minType:minType,
            maxType:maxType,
            info:''
        };

        countMapModel.find({infoType:{$lt:maxType,$gte:minType}},function(err,docs){
            if(err)
            {
                if(typeof err !== 'string')
                    err = err.errMsg || '不知名的错误';
                response.success = false;
                response.message = err;
                handler.finalSend(res,response);
            }
            else{
                response.countList = JSON.parse(JSON.stringify(docs));
                handler.finalSend(response);
            }
        });
    },
};

module.exports = handler;