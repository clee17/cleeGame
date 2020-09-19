let express = require('express'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4')),

    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic')),
    tagMapModel = require(path.join(__dataModel,'cleeArchive_tagMap')),
    indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    userModel = require(path.join(__dataModel,'user')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let readDatabase = null;

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    bookedit:function(req,res,next) {
        let requestIndex = req.query.id;
        let data = {ready:false,currentIndex:null,bookDetail:null};
        if(!requestIndex)
        {
            res.render('cleeArchive/errorB.html',{error:'请输入准确的书籍页码'});
        }
        else{
            indexModel.findOne({_id:requestIndex},function(err,doc){
                if(err){
                    data.currentIndex = null;
                    res.render('cleeArchive/errorB.html',{error:'请输入准确的书籍页码'});
                }
                else
                {
                    data.currentIndex = JSON.parse(JSON.stringify(doc));
                    handler.getBookPage(req,res,data,true,0);
                }

            }).populate('chapter');
        }
    },

    techNew:function(req,res){
        let data = {};

        res.render('cleeArchive/bookTechNew.html',data);
    },

    bookNew:function(req,res) {
        let data = {ready:false,currentIndex:null,bookDetail:null};
        handler.getBookPage(req,res,data,false,0);
    },

    getBookPage:function(req,res,data,published,type) {
        let setting = req.session.user ? req.session.user.settings.role : 0;
        if (!req.session.user){
            __renderError(req, res, _errInfo[136]);
            return;
        }else if(req.session.user.isAdmin){
        }else if(req.session.user && setting && (setting.role & 1) >0){
        }else if( (setting.role & 1) <= 0){
            __renderError(req, res, _errInfo[135]);
            return;
        }

        data.fanfic_grade = JSON.parse(JSON.stringify(__identityInfo.fanfic_grade));
        data.fanfic_warning = JSON.parse(JSON.stringify(__identityInfo.fanfic_warning));
        for(let i=0;i<data.fanfic_grade.length;++i){
            let num =data.fanfic_grade[i].refer;
            let item =  data.fanfic_grade[i];
            item.refer = _infoAll[num];
        }

        for(let i=0;i<data.fanfic_warning.length;++i){
            let num = data.fanfic_warning[i].refer;
            let item =  data.fanfic_warning[i];
            item.refer = _websiteInfo[num];
        }

        if(!published){
            data.workIndex = [
                {
                    order:0, chapterOrder:0,
                    chapter:null,
                    _id:null,wordCount:0,uploaded:true,published:false,
                    title:""
                }
            ];
            data.chapters = [];
            data.book = {
                    title:"",
                    user:{user:req.session.user.user,_Id:req.session.user._id},
                    type:0, //0 同人文
                    status:0,//狀態，0已完结，1连载中。
                    published:false,
                    chapterCount:0,
                    chapterDeleted:0,
                    wordCount:0,
            };
            data.bookDetail = {
                notes:"", //章节介绍
                fandom:[],
                relationships:[],
                tag:[],
                warning:[],
                grade: 0, // 0, 全年龄向； 1, nc-17; 2 nc-21;
            };
            data.currentIndex  = data.workIndex[0];
            __renderSubPage(req,res,'booknew',data);
        }else{
            let searchCriteria = {user:req.session.user._id,published:published};
            if(data.currentIndex)
                searchCriteria._id = data.currentIndex.work;
            worksModel.findOne(searchCriteria).exec()
                .then(function(doc){
                    if(!doc)
                        throw _errInfo[137];
                    data.book = JSON.parse(JSON.stringify(doc));
                    return indexModel.find({work:doc._id},{order:1}).populate('chapter','_id title type fandom relationships characters tag intro grade warning wordCount').exec();
                })
                .then(function(index){
                    if(!doc)
                        throw _errInfo[138];
                    data.workIndex =  index.map(function(item){
                        let json =  JSON.parse(JSON.stringify(item));
                        json.prevOrder = json.order;
                        if(json.prev === null){
                            data.bookDetail = json.chapter || {};
                            if(!data.currentIndex)
                                data.currentIndex ={
                                     _id:json.chapter._id,
                                    order:json.chapter.order || 0
                                }
                        }
                        return {
                            _id:json._id,
                            order:json.order,
                            chapterOrder:json.chapter.order || 0,
                            title:json.chapter.title,
                            chapter:json.chapter._id,
                            wordCount:json.chapter.wordCount,
                            uploaded:true,
                            published:true
                        };
                    });
                    if(data.currentIndex.chapter && data.currentIndex.chapter.chapter)
                        data.currentIndex.chapter = data.currentIndex.chapter._id;
                })
                .catch(function(err){
                    __renderError(req, res, err.message);
                });
        }
    },

    entry:function(req,res){
        let id = JSON.parse(JSON.stringify(req.session.user));
        delete id.password;
        if(req.session.user)
            __renderSubPage(req,res,'entry',{id:id});
    },

    userSetting:function(req,res){
        let userId = req.params.userId;
        let readerId = '';
        if(!req.session.user){
            res.render('cleeArchive/errorB.html',{error:'您没有获取该页面的权限'});
            return;
        }
        __renderSubPage(req,res,'userSetting',{user:req.session.user});
    },

    userPage:function(req,res){
        let userId = req.params.userId;
        let readerId = '';
        if(req.session.user)
            readerId = req.session.user._id;
        let sent = false;
        let response = {
            success:false,
            user:null,
            readerId:readerId,
            function:[],
            message:''
        };
        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            response.websiteInfo = _websiteInfo;
            if(response.user)
                response.user.intro = lzString.decompressFromBase64(response.user.intro);

            if(response.user){
                res.render('cleeArchive/userPage.html',response);
            } else
                res.render('cleeArchive/errorB.html',{error:'该用户不存在'});
        };
        userModel.findOne({_id:userId}).exec()
            .then(function(reply){
                if(!reply)
                    throw '不存在该用户';
                response.success = true;
                response.user = JSON.parse(JSON.stringify(reply));
                return userSettingModel.findOne({user:userId}).exec();
            })
            .then(function(doc){
                 if(!doc)
                     throw '获取用户信息失败,该用户从未登录';
                 response.user.setting = JSON.parse(JSON.stringify(doc));
                 return tagMapModel.aggregate([
                     {$match:{user:mongoose.Types.ObjectId(userId)}},
                     {$group:{_id:"$tag",totalCount:{$sum:1},list:{$push:"$$ROOT"}}},
                     {$lookup:{from:"tag",localField:"_id",foreignField:"_id",as:"tag"}},
                     {$unwind:"$tag"}
                 ]).exec();
            })
            .then(function(docs){
                response.tagList = JSON.parse(JSON.stringify(docs));
                return worksModel.aggregate([
                    {$match:{published:true,user:mongoose.Types.ObjectId(userId)}},
                    {$group:{_id:"$type",num:{$sum:1}}},
                ]).exec();
            })
            .then(function(docs) {
                let tmpResult = {
                };
                for (let i = 0; i < docs.length; ++i) {
                    tmpResult[docs[i]._id] = docs[i].num;
                };
                response.workCount = tmpResult;
                response.fanfic_grade = JSON.parse(JSON.stringify(__identityInfo.fanfic_grade));
                for(let i=0;i<response.fanfic_grade.length;++i){
                    let num = response .fanfic_grade[i].refer;
                    let item =  response .fanfic_grade[i];
                    item.refer = _infoAll[num];
                }
                finalSend();
            })
            .catch(function(err){
                sent = true;
                console.log(err);
                res.render('cleeArchive/errorB.html',{error:err});
            })
    }
};

module.exports = handler;