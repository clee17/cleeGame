let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic')),
    msgPoolModel = require(path.join(__dataModel,'cleeArchive_msgPool')),
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

        let queryChapter =  [
                {$match:{infoType:1}},
                {$lookup:{from:"work_chapters",as:"chapter",let:{chapterId:"$contents"},pipeline:[
                            {$match:{$expr:{$eq:["$_id","$$chapterId"]},published:true}},
                            {$project:{contents:0}}]}},
                {$unwind:"$chapter"},
                {$lookup:{from:"works",as:"work",let:{workId:"$chapter.book"},pipeline:[
                            {$match:{$expr:{$eq:["$_id","$$workId"]},published:true}}
                            ,]}},
                {$unwind:"$work"},
                {$lookup:{from:"work_index", foreignField:"chapter",localField:"chapter._id",as:"index"}},
                {$unwind:"$index"},
            ];

        let queryWork = [
            {$match:{infoType:0}},
            {$lookup:{from:"works",as:"work",let:{workId:"$work"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$workId"]},published:true}},
                    ]}},
            {$unwind:"$work"},
            {$lookup:{from:"work_index",as:"index",let:{workId:"$work._id"},pipeline:[
                        {$match:{$expr:{$eq:["$work","$$workId"]},order:0}},
                    ]}},
            {$unwind:"$index"},
            {$lookup:{from:"work_chapters",as:"chapter",let:{chapterId:"$index.chapter"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapterId"]}}},
                        {$project:{contents:0}}
                    ]}},
            {$unwind:"$chapter"},
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


        msgPoolModel.aggregate([
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
        ]).exec()
            .then(function(docs){
                console.log(docs);
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