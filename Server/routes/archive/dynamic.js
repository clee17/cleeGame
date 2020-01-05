let express = require('express'),
    path = require('path'),
    fs = require('fs'),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string')),

    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic')),
    indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),

    userModel = require(path.join(__dataModel,'user')),
    userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let readDatabase = null;

let handler = {
    bookedit:function(req,res,next) {
        let requestIndex = req.query.id;
        let data = {ready:false,currentIndex:null,bookDetail:null};
        if(!requestIndex)
        {
            handler.getBookPage(req,res,data)
        }
        else{
            indexModel.findOne({_id:requestIndex},function(err,doc){
                if(err)
                    data.currentIndex = null;
                else
                    data.currentIndex = JSON.parse(JSON.stringify(doc));
                handler.getBookPage(req,res,data,true);
            }).populate('chapter');
        }
    },

    bookNew:function(req,res) {
        let data = {ready:false,currentIndex:null,bookDetail:null};
        handler.getBookPage(req,res,data,false);
    },

    getBookPage:function(req,res,data,published){
        redisList = ['grade','warning'];
        let sent = false;
        let nextStep = function () {
            finalSend();
            if(req.session.user && !data.user)
                data.user = {username:req.session.user.user};
            if (redisList.length > 0)
                readRedis();
            else if(!data.ready)
                readDataBase();
        };

        let readRedis = function () {
            redisClient.mget(redisList, function (err, docs) {
                if (err) {
                    console.log(err);
                    __readSettings(nextStep,data);
                    redisList.length = 0;
                }
                else if(docs.indexOf(null) != -1)
                {
                    __readSettings(nextStep,data);
                    redisList.length = 0;
                }
                else
                {
                    for(let i=0;i<redisList.length;i++)
                    {
                        data['fanfic_'+redisList[i]] = JSON.parse(docs[i]);
                    }
                    redisList.length = 0;
                    nextStep();
                }
            });
        };

        finalSend = function(){
            if(sent)
                return;
            data.user = req.session.user;
            if (data.err) {
                __renderError(req,res,"后端出错，请报告该错误给网站管理员，管理员将及时修复。<br>"+data.err);
                sent = true;
            } else if (!req.session.user) {
                __renderError(req,res,data.err);
                sent = true;
            } else if(data.ready){
                res.render('cleeArchive/booknew.html',data);
                sent = true;
            }
        };

        readDataBase = function() {
            let searchCriteria = {user:req.session.user._id,published:published};
            if(data.currentIndex)
                searchCriteria._id = data.currentIndex.work;

            let updateCondition = {};

            worksModel.findOneAndUpdate(searchCriteria,{},{new: true, upsert: true,setDefaultsOnInsert: true}).exec()
                .then(function(doc){
                    if(!doc)
                        throw '无法为作者创建编辑中作品信息，数据库出错';
                    data.book = JSON.parse(JSON.stringify(doc));
                    searchCriteria = {work:doc._id,prev:null,order:0};
                    updateCondition = {};
                    return indexModel.findOneAndUpdate(searchCriteria,updateCondition,{new:true,upsert:true,setDefaultsOnInsert: true}).populate('chapter','_id title type fandom relationships characters tag intro grade warning wordCount').exec();
                })
                .then(function(doc){
                    if(!doc)
                        throw '无法获取首章目录索引';
                    if(doc.chapter)
                        data.bookDetail = JSON.parse(JSON.stringify(doc.chapter));
                    if(!data.currentIndex)
                        data.currentIndex = JSON.parse(JSON.stringify(doc));
                    data.chapters = [];
                    data.chapters.push(JSON.parse(JSON.stringify(doc)));
                    if(data.currentIndex.chapter && data.currentIndex.chapter.chapter) 
                        data.currentIndex.chapter = data.currentIndex.chapter._id;
                    return indexModel.find({work:data.book._id}).populate('chapter','title _id wordCount fandom relationships characters tag').exec();
                })
                .then(function(docs){
                    if(!docs)
                        throw '无法获取当前作品目录';
                    docs.map(function(item,i,err){
                        if(item._id != data.chapters[0]._id)
                            data.chapters.push(JSON.parse(JSON.stringify(item)));
                    });
                    data.ready = true;
                    nextStep();
                })
                .catch(function(err){
                    console.log(err);
                    data.err=err;
                    nextStep();
                });
        };

        nextStep();
    },

    entry:function(req,res){
        let id = req.session.user;
        delete id.password;
        if(req.session.user)
            res.render('cleeArchive/entry.html',id);
    },

    userPage:function(req,res,next){
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
            if(response.user)
                res.render('cleeArchive/userPage.html',response);
            else
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
                 finalSend();
            })
            .catch(function(err){
                sent = true;
                res.render('cleeArchive/errorB.html',{error:err});
            })
    }
};

module.exports = handler;