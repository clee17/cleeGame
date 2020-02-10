let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    chapterModel = require(path.join(__dataModel,'cleeArchive_fanfic')),
    likeModel = require(path.join(__dataModel,'cleeArchive_postLike')),
    commentModel = require(path.join(__dataModel,'cleeArchive_postComment')),
    tagModel = require(path.join(__dataModel,'cleeArchive_tag')),
    visitorModel = require(path.join(__dataModel,'cleeArchive_userValidate')),
    tagMapModel = require(path.join(__dataModel,'cleeArchive_tagMap')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works'));

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        if(!res)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    request:function(req,res){
        let indexData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            success:false
        };

        if(!__validateId(indexData.work) || !__validateId(indexData.chapter))
        {
            result.message = 'no valid id received';
            handler.finalSend(res,result);
            return;
        }

        chapterModel.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(indexData.chapter),published:true,book:mongoose.Types.ObjectId(indexData.work)}},
            {$lookup:{from:'works',as:"book",let:{chapter_id:"$book"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapter_id"]}}},
                        {$project:{contents:0}}
                    ]}},
            {$unwind: "$chapter" },
            {$lookup:{from:'works',localField:"chapter.book",foreignField:"_id",as:"work"}},
            {$unwind: "$work" },
            {$lookup:{from:"post_like", let:{work_id:"$_id",user_id:"$work.user"},as:"work.feedback",pipeline:[
                        likeModelMatch,
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
            {$lookup:{from:"post_like", let:{work_id:"$_id",user_id:"$user"},as:"work.feedbackAll",pipeline:[
                        {$match:{$expr:{$eq:["$work","$$work_id"]},status:1,user:{$ne:null}}},
                        {$limit:15},
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
            {$lookup:{from:'work_index',localField:"chapter._id",foreignField:"chapter",as:"index"}},
            {$unwind: "$index" },
            {$facet:{
                    "fanfic_chapter":[
                        {$match:{"work.type":{$lt:100},$or:[{"work.status":1},{"work.chapterCount":{$gt:1}}],"chapter.published":true,infoType:1}},
                        {$set:{updated:"$chapter.date"}},
                    ],
                    "fanfic_works":[
                        {$match:{"work.type":{$lt:100},"index.order":0,"work.published":true,infoType:0}},
                        {$set:{updated:"$work.date"}}
                    ]
                }},
            {$project:{all:{$setUnion:["$fanfic_chapter","$fanfic_works"]}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$sort:{updated:-1}},
            {$lookup:{from:"post_comment", let:{work_id:"$work._id",chapter_id:"$chapter._id",post_type:"$infoType"},as:"commentList",pipeline:[
                        {$match:{$and:[{$expr:{$eq:["$chapter","$$chapter_id"]}},{$expr:{$eq:["$work","$$work_id"]}},{$expr:{$eq:["$infoType","$$post_type"]}}]}},
                        {$sort:{date:-1}},
                        {$limit:15},
                        {$project:{work:0,chapter:0,infoType:0}}]}},
        ])
    },
};

module.exports = handler;