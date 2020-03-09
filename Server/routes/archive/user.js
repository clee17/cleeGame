let express = require('express'),
    mongoose = require('mongoose'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let applicationModel = require(path.join(__dataModel,'application')),
    userModel = require(path.join(__dataModel,'user')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting')),
    visitorModel = require(path.join(__dataModel,'cleeArchive_userValidate')),
    tagModel =  require(path.join(__dataModel,'cleeArchive_tag')),
    followModel = require(path.join(__dataModel,'cleeArchive_follow')),
    tagMapModel = require(path.join(__dataModel,'cleeArchive_tagMap'));

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

    register: function (req, res) {
        let registerId = req.params.registerId;

        if (req.session.user) {
             __renderError(req,res,_errAll[9]);
            return;
        }
        applicationModel.findOne({_id:registerId},function(err,doc){
            if(err){
                __renderError(req,res,err);
            }else if(!doc){
                __renderError(req,res,_errAll[4]);
            }else if (doc.status < 1){
                __renderError(req,res,_errAll[5]);
            }else if (doc.status === 2){
                __renderError(req,res,_errAll[6]);
            }else if(doc.status === 3){
                __renderError(req,res,_errAll[7]);
            }else{
                __renderIndex(req, res, {
                    viewport: '/view/register.html',
                    controllers: ['/templates/login.js', '/templates/register_con.js'],
                    services: [],
                    variables: {registerId: registerId, mail:doc.mail,intro:doc.statements, loginMode: 1}});
            }
        });
    },

    follow:function(req,res){
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent: false,
            success: false,
            message: '',
        };

        if(!data.target)
             response.message = _errInfo[18];
        else if (!req.session.user)
            response.message = _errInfo[0];
        else if(data.userId !== req.session.user._id)
            response.message = _errInfo[1];

        if(response.message !== ''){
            handler.finalSend(res,response);
            return;
        }

        followModel.findOneAndUpdate({type:data.type,user:req.session.user._id,target:data.target},
            {status:data.status,saved:data.saved},
            {new:true,upsert:true,setDefaultsOnInsert: true},
            function(err,doc){
                  if(err)
                      response.message = err;
                  else if(doc){
                      response.success = true;
                      response.result = JSON.parse(JSON.stringify(doc));
                  }
                  handler.finalSend(res,response);
            });
    },

    getTagFollowed:function(req,res){
        let response = {
            sent: false,
            success: false,
            message: '',
        };

        if(!req.session.user)
            response.message = _errAll[13];

        if(response.message !== ''){
            handler.finalSend(res,response);
            return;
        }

        followModel.aggregate([
            {$match:{type:0,user:mongoose.Types.ObjectId(req.session.user._id),status:true}},
            {$lookup:{from: 'tag', localField: "target", foreignField: "_id",as:"target"}},
            {$unwind:'$target'},
            ],function(err,result){
            if(err)
                response.message = err;
            else{
                response.success = true;
                response.result = JSON.parse(JSON.stringify(result));
                if(response.result.length === 0)
                    response.message = _errInfo[9];
            }
            handler.finalSend(res,response);
        });
    },

    updateFollowed:function(req,res){
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent: false,
            success: false,
            message: '',
        };

        if(!req.session.user)
            response.message = _errAll[13];

        if(response.message !== ''){
            handler.finalSend(res,response);
            return;
        }

        followModel.findOneAndUpdate(
            {type:data.type,user:req.session.user._id,target:data.target},
            {saved:data.saved},
            {new:true},
        function(err,doc){
            if(err)
                response.message = err;
            else{
                response.success = true;
            }
            handler.finalSend(res,response);
        });
    },

    reloadSettings:function(req,res){
        let response = {
            sent: false,
            success: false,
            message: ''
        };

        if(!req.session.user)
            response.message = '您的登录状态已过期，请重新登录';
        if(response.message !== '')
            handler.finalSend(res,response);

        userSettingModel.findOne({user:req.session.user._id},function(err,doc){
            if(err)
                response.message = err;
            else if(doc)
                response.result = doc;
            if(response.result){
                response.success = true;
                req.session.user.settings = doc;
            }
            handler.finalSend(res,response);
        })
    },

    userSetting: function (req, res) {
        let userId = req.params.userId;
        let response = {
            sent: false,
            success: false,
            userInfo: null,
            visitorId: null,
            readerId: null,
            query: req.query,
            message: ''
        };

        if (!req.session.user || req.session.user._id != userId)
            __renderError(req, res, _errAll[3]);
        else {
            let settings=  {mail:req.session.user.mail || '',
            intro:req.session.user.intro ? req.session.user.intro : ''};
            __renderIndex(req, res, {
                viewport: '/dynamic/users/setting/' + userId,
                title: req.session.user.user + '的个人设置',
                controllers: ['/view/cont/userSet_con.js'],
                modules: ['/view/modules/workInfo.js', '/view/modules/commentList.js', '/view/modules/pageIndex.js'],
                services: ['/view/cont/userService.js'],
                variables: {settings:settings,userAccess:req.session.user.settings.access,userName:req.session.user.user,preference:req.session.user.settings.preference || 29}
            });
        }
    },

    userPage: function (req, res) {
        let userId = req.params.userId;
        let query = req.query;
        let response = {
            sent: false,
            success: false,
            userInfo: null,
            visitorId: null,
            readerId: null,
            query: req.query,
            message: ''
        };
        if (req.session.user)
            response.readerId = req.session.user._id;
        let finalSend = function () {
            if (response.sent)
                return;
            if (response.userInfo)
                __renderIndex(req, res, {
                    viewport: '/dynamic/users/' + userId,
                    title: response.userInfo.user + '的主页',
                    controllers: ['/view/cont/dashboard_con.js'],
                    styles: ['archive/user'],
                    modules: ['/view/modules/workInfo.js', '/view/modules/commentList.js', '/view/modules/pageIndex.js'],
                    services: ['/view/cont/userService.js', '/view/cont/filterWord.js', '/view/cont/fanficService.js', '/view/cont/feedbackService.js'],
                    variables: {
                        userId: response.userInfo._id,
                        readerId: response.readerId,
                        query: query,
                        visitorId: response.visitorId
                    }
                });
            else
                __renderError(req, res, response.message);
        };
        userModel.findOne({_id: userId}).exec()
            .then(function (reply) {
                if (!reply)
                    throw '不存在该用户';
                response.success = true;
                response.userInfo = JSON.parse(JSON.stringify(reply));
                return visitorModel.findOneAndUpdate({ipa: req.ip}, {}, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                    new: true
                }).exec();
            })
            .then(function (doc) {
                response.visitorId = doc._id;
                finalSend();
            })
            .catch(function (err) {
                console.log(err);
                response.message = err;
                finalSend();
            })
    },

    saveSetting: function (req, res) {
        let settingData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let data = {
            success: false,
            status: 200,
            message: '',
            sent: false
        };

        if (!req.session.user) {
            data.message = '需要重新登录';
            data.status = 503;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        } else {
            userSettingModel.findOneAndUpdate({user: req.session.user._id}, settingData, {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }, function (err, doc) {
                if (err)
                    data.message = err;
                else {
                    data.success = true;
                    data.info = JSON.parse(JSON.stringify(doc));
                    req.session.user.settings = JSON.parse(JSON.stringify(doc));
                }
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            })
        }
    },

    requestDashboard: function (req, res) {
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            sent: false,
            success: false,
            message: 'dashboardRequestFinished',
            info: '',
            userId: data.userId,
        };

        let validateUserId = data.userId && __validateId(data.userId);

        if (!validateUserId)
            handler.sendError(res, response, '不是有效的用户ID');

        if (!data.pageId)
            handler.requestUpdates(req, res, data, response);
        else if (data.pageId == 1000)
            handler.requestWorkboard(req, res, data, response);
        else if (data.pageId == 1005)
            handler.requestRecommendationBoard(req, res, data, response);
        else if (data.pageId == 1010)
            handler.requestSeries(req, res, data, response);
        else if (data.pageId == 1025)
            handler.requestTagBoard(req, res, data, response);
        else
            handler.sendError(res, response, '查询参数错误');
    },

    requestTagBoard(req, res, data, response) {
        let startPage = data.subPage || 1;
        startPage--;
        let perPage = data.perPage || 10;
        let tagName = data.tagId;
        let sent = false;

        let sendError = function (msg) {
            if (sent)
                return;
            sent = true;
            response.info = msg;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        };

        let likeModelMatch = {
            $match: {
                $and: [{$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$targetUser", "$$user_id"]}}],
                status: 1
            }
        };
        if (req.session.user)
            likeModelMatch.$match.user = mongoose.Types.ObjectId(req.session.user._id);
        else {
            likeModelMatch.$match.ipa = req.ip;
            delete likeModelMatch.$match.$and;
            likeModelMatch.$match.$expr = {$eq: ["$work", "$$work_id"]};
        }

        if (tagName)
            tagName = unescape(tagName);
        else
            sendError('不是有效的标签名称');

        if (sent)
            return;
        tagModel.findOne({_id: tagName}).exec()
            .then(function (doc) {
                if (!doc)
                    throw '不是有效的标签名称';
                return tagMapModel.aggregate([
                    {$match: {user: mongoose.Types.ObjectId(data.userId), tag: mongoose.Types.ObjectId(doc._id)}},
                    {
                        $lookup: {
                            from: 'work_chapters', as: "chapter", let: {chapter_id: "$aid"}, pipeline: [
                                {$match: {$expr: {$eq: ["$_id", "$$chapter_id"]}}},
                                {$project: {contents: 0}}
                            ]
                        }
                    },
                    {$unwind: "$chapter"},
                    {$lookup: {from: 'works', localField: "chapter.book", foreignField: "_id", as: "work"}},
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
                    {
                        $facet: {
                            "fanfic_chapter": [
                                {
                                    $match: {
                                        "work.type": {$lt: 100},
                                        $or: [{"work.status": 1}, {"work.chapterCount": {$gt: 1}}],
                                        "chapter.published": true,
                                        infoType: 1
                                    }
                                },
                                {$set: {updated: "$chapter.date"}},
                            ],
                            "fanfic_works": [
                                {
                                    $match: {
                                        "work.type": {$lt: 100},
                                        "index.order": 0,
                                        "work.published": true,
                                        infoType: 0
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "work_chapters",
                                        let: {bookId: "$work._id"},
                                        as: "countChapter",
                                        pipeline: [{
                                            $match: {
                                                $expr: {$eq: ["$book", "$$bookId"]},
                                                published: true
                                            }
                                        }, {$project: {contents: 0}}]
                                    }
                                },
                                {
                                    $set: {
                                        updated: "$work.date",
                                        infoType: 0,
                                        "work.visited": {$sum: "$countChapter.visited"},
                                        "work.wordCount": {$sum: "$countChapter.wordCount"}
                                    }
                                },
                            ]
                        }
                    },
                    {$project: {all: {$setUnion: ["$fanfic_chapter", "$fanfic_works"]}}},
                    {$unwind: "$all"},
                    {$replaceRoot: {newRoot: "$all"}},
                    {$sort: {updated: -1}},
                    {
                        $lookup: {
                            from: "post_comment",
                            let: {work_id: "$work._id", chapter_id: "$chapter._id", post_type: "$infoType"},
                            as: "commentList",
                            pipeline: [
                                {$match: {$and: [{$expr: {$eq: ["$chapter", "$$chapter_id"]}}, {$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$infoType", "$$post_type"]}}]}},
                                {$sort: {date: -1}},
                                {$limit: 15},
                                {$project: {work: 0, chapter: 0, infoType: 0}}]
                        }
                    },
                    {$lookup:{from:"user", let:{userId:"$chapter.user"},as:"chapter.user",pipeline:[
                                {$match:{$expr:{$eq:["$_id","$$userId"]}}},
                                {$project:{user:1,_id:1}}]}},
                    {$lookup:{from:"user_setting",localField:"chapter.user._id",foreignField:"user",as:"user_setting"}}
                ]).exec();
            })
            .then(function (docs) {
                response.success = true;
                response.maxLimit = docs.length;
                response.result = docs.slice(startPage * perPage, startPage * perPage + perPage);
                handler.filter(req, res, response);
            })


    },

    requestSeries: function (req, res, data, response) {
        response.success = true;
        response.maxLimit = 0;
        response.result = [];
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    requestRecommendationBoard: function (req, res, data, response) {
        response.success = true;
        response.maxLimit = 0;
        response.result = [];
        res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    requestWorkboard: function (req, res, data, response) {
        let startPage = data.subPage || 1;
        startPage--;
        let perPage = data.perPage || 10;

        if (data.type && data.type == 1)
            response.maxLimit = data.userSetting.workCount.maxChaptersCount || 0;

        let likeModelMatch = {
            $match: {
                $and: [{$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$targetUser", "$$user_id"]}}],
                status: 1
            }
        };
        if (req.session.user)
            likeModelMatch.$match.user = mongoose.Types.ObjectId(req.session.user._id);
        else {
            likeModelMatch.$match.ipa = req.ip;
            delete likeModelMatch.$match.$and;
            likeModelMatch.$match.$expr = {$eq: ["$work", "$$work_id"]};
        }

        worksModel.aggregate([
            {$match: {user: mongoose.Types.ObjectId(data.userId), type: {$lte: 10}, published: true}},
            {$sort: {updated: -1}},
            {
                $lookup: {
                    from: "post_like", let: {work_id: "$_id", user_id: "$user"}, as: "feedback", pipeline: [
                        likeModelMatch,
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {
                $lookup: {
                    from: "post_like", let: {work_id: "$_id", user_id: "$user"}, as: "feedbackAll", pipeline: [
                        {$match: {$expr: {$eq: ["$work", "$$work_id"]}, status: 1, user: {$ne: null}}},
                        {$limit: 15},
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {$project: {work: "$$ROOT"}},
            {$set: {infoType: 0}},
            {
                $lookup: {
                    from: 'work_index', as: "index",
                    let: {work_id: "$_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ["$work", "$$work_id"]}, order: 0}},
                        {$project: {contents: 0}}
                    ]
                }
            },
            {$unwind: "$index"},
            {
                $lookup: {
                    from: 'work_chapters', as: "chapter",
                    let: {work_id: "$_id", chapter_id: "$index.chapter"},
                    pipeline: [
                        {$match: {$expr: {$eq: ["$_id", "$$chapter_id"]}}},
                        {$project: {contents: 0}}
                    ]
                }
            },
            {$unwind: "$chapter"},
            {
                $lookup: {
                    from: "user", let: {userId: "$chapter.user"}, as: "chapter.user", pipeline: [
                        {$match: {$expr: {$eq: ["$_id", "$$userId"]}}},
                        {$project: {user: 1, _id: 1}}]
                }
            },
            {$unwind: "$chapter.user"},
            {
                $lookup: {
                    from: "work_chapters",
                    let: {bookId: "$work._id"},
                    as: "countChapter",
                    pipeline: [{
                        $match: {
                            $expr: {$eq: ["$book", "$$bookId"]},
                            published: true
                        }
                    }, {$project: {contents: 0}}]
                }
            },
            {
                $set: {
                    updated: "$work.updated",
                    infoType: 0,
                    "work.visited": {$sum: "$countChapter.visited"},
                    "work.wordCount": {$sum: "$countChapter.wordCount"}
                }
            },
            {
                $lookup: {
                    from: "post_comment",
                    let: {work_id: "$work._id", chapter_id: "$chapter._id", post_type: "$infoType"},
                    as: "commentList",
                    pipeline: [
                        {$match: {$and: [{$expr: {$eq: ["$chapter", "$$chapter_id"]}}, {$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$infoType", "$$post_type"]}}]}},
                        {$sort: {date: -1}},
                        {$limit: 15},
                        {$project: {work: 0, chapter: 0, infoType: 0}}]
                }
            },
            {$lookup:{from:"user_setting",localField:"chapter.user",foreignField:"user",as:"user_setting"}}
        ])
            .then(function (docs) {
                response.success = true;
                response.maxLimit = docs.length;
                response.result = docs.slice(startPage * perPage, startPage * perPage + perPage);
                handler.filter(req, res, response);
            })
            .catch(function (err) {
                if (err.success)
                    return;
                handler.sendError(res, response, err);
            });
    },

    requestUpdates: function (req, res, data, response) {
        let sent = false;
        let startPage = data.subPage || 1;
        startPage--;
        let perPage = data.perPage || 10;

        if (!data.userId)
            handler.sendError(res, response, '不是有效的用户ID');
        if (sent)
            return;

        data.userId = mongoose.Types.ObjectId(data.userId);
        let readerId = null;
        if (req.session.user)
            readerId = mongoose.Types.ObjectId(req.session.user._id);
        let ip = req.ip;
        response.type = 0;

        response.maxLimit = data.maxMsgCount || 0;

        let likeModelMatch = {
            $match: {
                $and: [{$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$targetUser", "$$user_id"]}}],
                status: 1
            }
        };
        if (req.session.user)
            likeModelMatch.$match.user = mongoose.Types.ObjectId(req.session.user._id);
        else {
            likeModelMatch.$match.ipa = req.ip;
            delete likeModelMatch.$match.$and;
            likeModelMatch.$match.$expr = {$eq: ["$work", "$$work_id"]};
        }

        worksModel.aggregate([
            {$match: {user: data.userId, published: true, type: {$lt: 100}}},
            {
                $lookup: {
                    from: "post_like", let: {work_id: "$_id", user_id: "$user"}, as: "feedback", pipeline: [
                        likeModelMatch,
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {
                $lookup: {
                    from: "post_like", let: {work_id: "$_id", user_id: "$user"}, as: "feedbackAll", pipeline: [
                        {$match: {$expr: {$eq: ["$work", "$$work_id"]}, status: 1, user: {$ne: null}}},
                        {$limit: 15},
                        {$project: {status: 1, type: 1, userName: 1, user: 1}}]
                }
            },
            {
                $facet: {
                    "fanfic_chapter": [
                        {$match: {type: {$lt: 100}, $or: [{status: 1}, {chapterCount: {$gt: 1}}], published: true}},
                        {$project: {work: "$$ROOT"}},
                        {
                            $lookup: {
                                from: "work_chapters", let: {work_id: "$_id"}, as: "chapter", pipeline: [
                                    {$match: {$expr: {$eq: ["$book", "$$work_id"]}, published: true}},
                                    {$project: {contents: 0}}]
                            }
                        },
                        {$unwind: "$chapter"},
                        {
                            $lookup: {
                                from: "user", let: {userId: "$chapter.user"}, as: "chapter.user", pipeline: [
                                    {$match: {$expr: {$eq: ["$_id", "$$userId"]}}},
                                    {$project: {user: 1, _id: 1}}]
                            }
                        },
                        {$unwind: "$chapter.user"},
                        {$set: {updated: "$chapter.date", infoType: 1}},
                        {
                            $lookup: {
                                from: "work_index",
                                localField: "chapter._id",
                                foreignField: "chapter",
                                as: "index"
                            }
                        },
                        {$unwind: "$index"}
                    ],
                    "fanfic_works": [
                        {$match: {type: {$lt: 100}}},
                        {$project: {work: "$$ROOT"}},
                        {
                            $lookup: {
                                from: "work_index",
                                let: {work_id: "$_id"},
                                as: "index",
                                pipeline: [{$match: {$expr: {$eq: ["$work", "$$work_id"]}, order: 0}}]
                            }
                        },
                        {$unwind: "$index"},
                        {
                            $lookup: {
                                from: "work_chapters",
                                let: {chapter_id: "$index.chapter"},
                                as: "chapter",
                                pipeline: [{$match: {$expr: {$eq: ["$_id", "$$chapter_id"]}}}, {$project: {contents: 0}}]
                            }
                        },
                        {$unwind: "$chapter"},
                        {
                            $lookup: {
                                from: "user", let: {userId: "$chapter.user"}, as: "chapter.user", pipeline: [
                                    {$match: {$expr: {$eq: ["$_id", "$$userId"]}}},
                                    {$project: {user: 1, _id: 1}}]
                            }
                        },
                        {$unwind: "$chapter.user"},
                        {
                            $lookup: {
                                from: "work_chapters",
                                let: {bookId: "$work._id"},
                                as: "countChapter",
                                pipeline: [{
                                    $match: {
                                        $expr: {$eq: ["$book", "$$bookId"]},
                                        published: true
                                    }
                                }, {$project: {contents: 0}}]
                            }
                        },
                        {
                            $set: {
                                updated: "$work.date",
                                infoType: 0,
                                "work.visited": {$sum: "$countChapter.visited"},
                                "work.wordCount": {$sum: "$countChapter.wordCount"}
                            }
                        },
                        {$project: {countChapter: 0}}
                    ]
                }
            },
            {$project: {all: {$setUnion: ["$fanfic_chapter", "$fanfic_works"]}}},
            {$unwind: "$all"},
            {$replaceRoot: {newRoot: "$all"}},
            {$sort: {updated: -1}},
            {
                $lookup: {
                    from: "post_comment",
                    let: {work_id: "$work._id", chapter_id: "$chapter._id", post_type: "$infoType"},
                    as: "commentList",
                    pipeline: [
                        {$match: {$and: [{$expr: {$eq: ["$chapter", "$$chapter_id"]}}, {$expr: {$eq: ["$work", "$$work_id"]}}, {$expr: {$eq: ["$infoType", "$$post_type"]}}]}},
                        {$sort: {date: -1}},
                        {$limit: 15},
                        {$project: {work: 0, chapter: 0, infoType: 0}}]
                }
            },
            {$lookup:{from:"user_setting",localField:"chapter.user._id",foreignField:"user",as:"user_setting"}},
        ]).exec()
            .then(function (docs) {
                response.success = true;
                response.maxLimit = docs.length;
                let result = docs.slice(startPage * perPage, startPage * perPage + perPage);
                response.result = JSON.parse(JSON.stringify(result));
                handler.filter(req, res, response);
            })
            .catch(function (err) {
                console.log(err);
                response.msg = err;
                response.success = false;
                handler.sendError(res, response, err);
            })
    },

    calculate: function (req, res) {
        let sent = false;
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            result: null,
            sent: false,
            message: 'userCalculationEnded'
        };

        worksModel.aggregate([
            {$match: {user: mongoose.Types.ObjectId(data.user), published: true, type: {$lt: 100}}},
            {
                $facet: {
                    "fanfic_works": [
                        {$match: {type: {$lt: 5}}},
                        {$project: {_id: 1}},
                    ],
                    "fanfic_recommendation": [
                        {$match: {type: 5}},
                        {$count: "recommendCount"},
                    ],
                    "fanfic_series": [
                        {$match: {type: 10}},
                        {$count: "seriesCount"},
                    ]
                }
            },
        ]).exec()
            .then(function (docs) {
                let result = docs[0];
                if (!docs[0])
                    throw '查询结果出错';
                response.result = {};
                response.result.workCount = result.fanfic_works.length;
                response.result.recommendCount = result.fanfic_recommendation.length;
                response.result.seriesCount = result.fanfic_series.length;
                response.success = true;
                handler.finalSend(res, response);
            })
            .catch(function (err) {
                response.msg = err;
                response.success = false;
                handler.sendError(res, response, err);
            })
    },


    savePreference:function(req,res){
        let data = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            success: false,
            sent: false,
            preference:null,
            error:null,
        };

        if(!req.session.user)
            response.error = '您的登录已经失效';

        if(response.error)
            handler.finalSend(res,response);
        userSettingModel.findOneAndUpdate({user:req.session.user._id},{preference:data.preference},{new:true},function(err,doc){
               if(err)
                   response.error = err;
               if(!response.error)
                   response.success = true;
               response.preference = doc.preference;
               handler.finalSend(res,data);
        });

    }
};

module.exports = handler;