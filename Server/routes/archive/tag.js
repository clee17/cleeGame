let express = require('express'),
    mongoose = require('mongoose'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let tagModel =  require(path.join(__dataModel,'cleeArchive_tag')),
    followModel = require(path.join(__dataModel,'cleeArchive_follow'));

let md5 = crypto.createHash('md5');

let handler = {
    finalSend: function (res, data) {
        if (data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    sendError: function (res, data, msg) {
        if (data.sent)
            return;
        data.info = msg;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    filterContents: function (req,res, data) {
        let userId = req.session.user? req.session.user._id :null;
        for (let i = 0; i < data.result.length; ++i) {
            if (data.result[i].chapter.grade > 0 && data.result[i].work.user != userId){
                if(req.session.user && (req.session.user.settings.preference >> 5 & 1))
                {
                    data.result[i].blocked = true;
                    delete data.result[i].chapter.intro;
                    delete data.result[i].chapter.tag;
                }
                else
                    data.result[i] = -1
            }
        }
        while(data.result.indexOf(-1) >=0){
            data.result.splice(data.result.indexOf(-1),1);
        }
        handler.finalSend(res, data);
    },

    filter: function (req, res, data) {
        if (req.session.user && req.session.user.settings.access.indexOf(202) !== -1)
            handler.finalSend(res, data);
        else if (req.session.user && req.session.user._id == data.userId)
            handler.finalSend(res, data);
        else if (req.session.user && req.session.user.userGroup >= 999)
            handler.finalSend(res, data);
        else if (__getCountryCode(req.ipData) !== 'CN')
            handler.finalSend(res, data);
        else
            handler.filterContents(req,res, data);
    },

    searchTag:function(req, res) {
        let tagName = req.query.id;
        if (tagName)
            tagName = unescape(tagName);
        else
            __renderError(_errAll[14]);
        __renderIndex(req,res,{viewport:'/tag/tagPage?id='+escape(tagName),
            modules:['/view/modules/workInfo.js','/view/modules/commentList.js','/view/modules/pageIndex.js'],
            services: ['/view/cont/tagService.js', '/view/cont/filterWord.js', '/view/cont/fanficService.js', '/view/cont/feedbackService.js','/view/cont/userService.js'],
            controllers:['view/cont/tag_con.js'],
            variables:{tagName:tagName}});
    },

    tagPage:function(req,res){
        let tagName = req.query.id;
        if (tagName)
            tagName = unescape(tagName);
        else
            res.render('cleeArchive/errorB.html',{error:_errAll[14]});

        let searchTagName = tagName.toLowerCase();

        let render = {
            tagName: tagName,
        };

        let finalRender = function(){
			__renderSubPage(req, res, 'tagPage', render);
		};

        tagModel.findOneAndUpdate({name: searchTagName},{$inc:{visited:1}},{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
            .then(function(doc){
                render.result = doc || {};
                let userId = req.session.user? req.session.user._id :null;
                return followModel.findOne({user:userId,type:0,target:doc._id});
             })
            .then(function(followed){
                render.followed=  followed? followed.status : false;
                render.userExisted = !!req.session.user;
               redisClient.get('fanfic_grade',function(err,grades) {
                render.fanfic_grade = {};
                console.log('entered fanfic grade');
                if (!err && grades){
                    render.fanfic_grade = JSON.parse(grades);
                    finalRender();
                }
				else
                    __readSettings(finalRender, render);
			   });
            })
            .catch(function(err){
                    res.render('cleeArchive/errorB.html',{error:JSON.stringify(err)});
             });
    },

    requestTag:function(req,res){
        console.log('entered');
        let tagId  = req.params.tagId;
        let data  = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let pageId = data.pageId;
        pageId--;
        let perPage = data.perPage;
        let response = {
            sent:false,
            message:'',
            result: null,
        };
        if(data.tagId !== tagId)
            response.message = _errInfo[16];


        if(response.message !== ''){
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

        tagModel.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(data.tagId)}},
            {$lookup:{from:"tag_map", let:{tagId:"$_id"},as:"data",pipeline:[
                        {$match:{$expr:{$eq:["$tag","$$tagId"]}}},
                        {$project:{infoType:1,work:1,aid:1}}]}},
            {$unwind:"$data"},
            {$replaceRoot: {newRoot: "$data"}},
            {$lookup: {from: 'work_chapters', as: "chapter", let: {chapter_id: "$aid"}, pipeline: [
                        {$match: {$expr: {$eq: ["$_id", "$$chapter_id"]}}},
                        {$project: {contents: 0}}
                    ]}},
            {$unwind: "$chapter"},
            {$lookup: {from: 'works', localField: "work", foreignField: "_id", as: "work"}},
            {$unwind: "$work"},
            {
                $lookup: {
                    from: "post_like",
                    let: {work_id: "$_id", user_id: "$work.user"},
                    as: "work.feedback",
                    pipeline: [
                        likeModelMatch,
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {
                $lookup: {
                    from: "post_like",
                    let: {work_id: "$_id", user_id: "$user"},
                    as: "work.feedbackAll",
                    pipeline: [
                        {$match: {$expr: {$eq: ["$work", "$$work_id"]}, status: 1, user: {$ne: null}}},
                        {$limit: 15},
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {$lookup: {from: 'work_index', localField: "chapter._id", foreignField: "chapter", as: "index"}},
            {$unwind: "$index"},
            {$facet: {
                    "fanfic_chapter": [
                        {
                            $match: {
                                $or: [{"work.status": 1}, {"work.chapterCount": {$gt: 1}}],
                                "chapter.published": true,
                                infoType: 1
                            }
                        },
                        {$set: {updated: "$chapter.date"}},
                    ],
                    "fanfic_works": [
                        {$match: {
                                "index.order": 0,
                                "work.published": true,
                                infoType: 0
                            }},
                        {$lookup: {from: "work_chapters",
                                let: {bookId: "$work._id"},
                                as: "countChapter",
                                pipeline: [{
                                    $match: {
                                        $expr: {$eq: ["$book", "$$bookId"]},
                                        published: true
                                    }
                                }, {$project: {contents: 0}}]}},
                        {$set: {updated: "$work.date",
                                "work.visited": {$sum: "$countChapter.visited"},
                                "work.wordCount": {$sum: "$countChapter.wordCount"}}},
                        {$project:{countChapter:0}},
                    ]}},
            {$project: {all: {$setUnion: ["$fanfic_chapter", "$fanfic_works"]}}},
            {$unwind: "$all"},
            {$replaceRoot: {newRoot: "$all"}},
            {$sort: {updated: -1}},
            {$skip:perPage*pageId},
            {$limit:perPage},
            {$lookup: {
                    from: "post_comment",
                    let: {work_id: "$work._id", chapter_id: "$chapter._id", post_type: "$infoType"},
                    as: "commentList",
                    pipeline: [
                        {$match: {$and: [{$expr: {$eq: ["$chapter", "$$chapter_id"]}}, {$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$infoType", "$$post_type"]}}]}},
                        {$sort: {date: -1}},
                        {$limit: 15},
                        {$project: {work: 0, chapter: 0, infoType: 0}}]
                }},
            {$lookup:{from:"user", let:{userId:"$chapter.user"},as:"chapter.user",pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$userId"]}}},
                        {$project:{user:1,_id:1}}]}},
            {$lookup:{from:"user_setting",localField:"chapter.user._id",foreignField:"user",as:"user_setting"}}
        ],function(err,docs){
            if(err){
                response.message = err;
                response.errCode = 404;
            }else{
                response.success = true;
                response.result = JSON.parse(JSON.stringify(docs));
                handler.finalSend(res,response);
            }
        });
    }
};

module.exports = handler;