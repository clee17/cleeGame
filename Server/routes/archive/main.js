let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    mongoose = require('mongoose'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works')),
    visitorModel = require(path.join(__dataModel,'cleeArchive_userValidate')),
    countMapModel = require(path.join(__dataModel,'cleeArchive_countMap')),
    applicationModel = require(path.join(__dataModel,'application')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic'));

let handler = {
    index:function(req,res,next){
        let response = {};
        let callBack = function(){
            handler.indexDetail(req,res,next,response.fanfic_grade);
        };
        redisClient.get('fanfic_grade',function(err,docs) {
            if (!err && docs) {
                handler.indexDetail(req,res,next,JSON.parse(docs));
            } else
                __readSettings(callBack, response);
        });
    },

    visitorDonate:function(req,res){
          let visitorId = req.query.id;
          if(!visitorId)
              __renderError(req,res,_errInfo[13]);
          else if(!__validateId(visitorId))
              __renderError(req,res,_errInfo[14]);
          else {

              applicationModel.findOne({_id:visitorId},function(err,doc){
                  if(!err && doc){
                      let data = {viewport:'/view/donate.html',controllers:['/view/cont/donate_Con.js'],services:['view/cont/userService.js'],variables:{visitorId:visitorId,mail:doc.mail,noUser:true}};
                      __renderIndex(req,res,data);
                  }
                  else
                      __renderError(req,res,err || _errInfo[15]);
              })
          }

    },

    indexDetail:function(req,res,next,fanfic_grade){
        let viewPortMap = new Map();
        viewPortMap.set('/',{viewport:'/dynamic/entry',controllers:['/view/cont/index_con.js'],services:['/view/cont/feedService.js']});
        viewPortMap.set('/fanfic',{viewport:'/view/fanficSearch.html',
            modules:['/view/modules/workInfo.js','/view/modules/commentList.js','/view/modules/pageIndex.js'],
            styles:[],
            controllers:['/view/cont/index_con.js','/view/cont/search_con.js'],
            services:['/view/cont/searchService.js','/view/cont/filterWord.js','/view/cont/fanficService.js','/view/cont/feedbackService.js'],
            variables:{searchList:[0,1],gradeTemplate:fanfic_grade}});
        viewPortMap.set('/tech',{viewport:'/view/tech.html',controllers:['/view/cont/index_con.js']});
        viewPortMap.set('/design',{viewport:'/view/design.html',controllers:['/view/cont/index_con.js']});
        viewPortMap.set('/admin',{viewport:'/view/admin.html',controllers:['/view/cont/admin_con.js'],services:['/service/userService.js']});
        viewPortMap.set('/welcome',{viewport:'/view/welcome.html',controllers:['/view/cont/introCon.js'],services:['view/cont/userService.js','/service/countService.js']});
        viewPortMap.set('/donate',{viewport:'/statement/donate',controllers:['/view/cont/donate_Con.js'],services:['view/cont/userService.js'],variables:{}});
        viewPortMap.set('/develop',{viewport:'/view/develop.html',controllers:['/view/cont/develop_con.js'],services:['view/cont/developService.js'],variables:{}});
        viewPortMap.set('/registerProcess',{viewport:'/view/registerProcess.html',controllers:['/view/cont/registerStatusCon.js'],services:['view/cont/userService.js']});
        let result = viewPortMap.get(req.url);
        if(!result)
            next();
        else if(req.url == '/' )
        {
            if(req.session.user)
                __renderIndex(req,res,result);
            else
                __renderIndex(req,res,viewPortMap.get('/welcome'));
        }
        else if(req.url === '/admin')
        {
            if(req.session.user && req.session.user.userGroup >= 999)
                __renderIndex(req,res,result);
            else
                __renderError(req,res,_errAll[2]);
        }
        else if(req.url ==='/donate'){
            if(req.session.user){
                result.variables.mail = {mail:req.session.user.mail || ''};
                __renderIndex(req,res,result);
            } else
                __renderError(req,res,_errAll[3]);
        }
        else if(req.url ==='/fanfic'){
            handler.fanficSearch(req,res,result);
        }
        else
            __renderIndex(req,res,result);
    },

    fanficSearch:function(req,res,result){
        let error = null;
        result.variables.searchList = [0,1];//default 是0,1，但如果有用户settings的话从settings里读取;
        result.variables.perPage = 20; //default是20，但是用户有settings的话从settings里读取;
        let visitorRequest = function(){
            visitorModel.findOneAndUpdate({ipa:req.ip},{},{upsert:true,setDefaultsOnInsert: true,new:true},function(err,doc){
                if(doc && !err)
                    result.variables.visitorId = doc._id;
                __renderIndex(req,res,result);
            });
        };

        countMapModel.find({infoType:{$lt:10,$gte:0}},function(err,docs){
            if(err)
                __renderError(req,res,err);
            else
            {
                result.variables.countList = JSON.parse(JSON.stringify(docs));
                if(!req.session.user)
                         visitorRequest();
                else
                    __renderIndex(req,res,result);
            }
        });
    },
    
    fanfic:function(req,res,next){
        let fileName = req.params.fanficId;
        let index = ['new','preview','validate'];
        if(index.indexOf(fileName) === -1)
        {
            if(fileName && fileName.indexOf('.html')!== -1)
                res.sendFile(path.join(__basedir,'public/html/',fileName));
            else
                handler.fanficDetail(req,res,next,fileName);
        }
        else
            next();
    },

    work:function(req,res,next){
       let workName = req.params.workId;
       if(!__validateId(workName))
           __renderError(req,res,_errInfo[12]);
       else
       {
           worksModel.findOne({_id:workName}).exec()
               .then(function(doc) {
                   if (!doc)
                       throw '数据库中没有该作品';
                   return indexModel.aggregate([
                       {$match:{work:doc._id}},
                       {$sort:{order:1}},
                       {$lookup: {from: 'work_chapters',as:"chapter",let:{chapter_id:"$chapter"},
                               pipeline:[
                                   {$match:{$expr:{$eq:["$_id","$$chapter_id"]},published:true}},
                                   {$project:{_id:1}}
                               ]}},
                       {$unwind:"$chapter"},
                       {$limit: 1}]).exec();
               })
               .then(function(docs){
                   if(docs.length == 0)
                       __renderError(req,res,_errAll[11]);
                   else
                       handler.fanficDetail(req,res,next,docs[0].chapter._id.toString());
               })
               .catch(function(err){
                   console.log(err);
                   __renderError(req,res,err);
               });
       }
    },

    fanficDetail:function(req,res,next,fileName){
        let readerId = req.session.user? req.session.user._id :  req.ip;
        let data = {book:null,chapter:null,index:null,codeMatch:false,readerId:readerId,sent:false};
        let noRes = null;
        let visitorId = '';

        if(!req.session.user)
            visitorModel.findOneAndUpdate({ipa:req.ip},{},{upsert:true,setDefaultsOnInsert: true,new:true},function(err,doc){
                if(doc &&!err)
                    visitorId = doc._id;
            });

        let finalSend = function(){
            if(data.sent)
                return;

            data.visitorId = visitorId;
            if(!req.session.user && visitorId.length===0)
            {
                let to  = setTimeout(finalSend,100);
                return;
            }
            data.readerId = readerId;

            data.sent = true;
            if(data.index &&  data.index.length && data.book)
            {
                if(data.index.length === 1 && data.book.status === 0)
                    data.title = data.book.title;
                else
                {
                    data.title = __chapterCount(data.chapter.order)+'    ' +data.chapter.title;
                }
            }

            if(data.chapter && (data.codeMatch  || !data.chapter.passcode))
                chapterModel.findOneAndUpdate({_id:data.chapter._id},{$inc:{visited:1}},function(err,doc){
                });

            if(req.ipData && req.ipData.country == '中国')
                data.lib = [
                    'https://cdn.bootcss.com/blueimp-md5/2.12.0/js/md5.min.js',
                    'https://cdn.bootcss.com/lz-string/1.4.4/lz-string.min.js',
                    'https://cdn.bootcss.com/angular.js/1.7.8/angular.min.js',
                    'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
            else
                data.lib = [
                    'https://cdn.jsdelivr.net/npm/blueimp-md5@2.12.0/js/md5.min.js',
                    'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js',
                    'https://cdn.jsdelivr.net/npm/angular@1.7.9/angular.min.js',
                    'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];

            if(noRes)
                __renderError(req,res,noRes.message);
            else if(data.chapter && data.chapter.lockType === 1 && !req.session.user)
                __renderError(req,res,_errInfo[10]);
            else if(data.chapter && data.chapter.lockType === 2)
                __renderError(req,res,_errInfo[11]);
            else if(!data.fanfic_grade)
                __renderError(req,res,_errAll[8]);
            else if(data.chapter && data.chapter.lockType <2)
                res.render('cleeArchive/fanfic.html',data);
        };

        if(!fileName.match(/^[0-9a-fA-F]{24}$/)){
            __renderError(req,res,_errInfo[12]);
            data.sent = true;
            return;
        }

        let finalProcess = function(doc){
            let copyData =JSON.parse(JSON.stringify(data));
            data = JSON.parse(JSON.stringify(doc));
            data.readerId = copyData.readerId;
            data.sent = copyData.sent;
            data.codeMatch = false;
            if(doc.chapter && doc.chapter.passcode.use)
            {
                let md5 = crypto.createHash('md5');
                let passCode =  md5.update(doc.chapter.passcode.code).digest('hex').toString();
                passCode = '"'+passCode+'"';
                if(passCode === req.cookies[doc.chapter._id])
                    data.codeMatch = true;
            }

            data.prev = null;
            let current = null;
            data.next = null;
            data.index.forEach(function(item,i,arr){
                if(item.published && item.chapter === data.chapter._id)
                    current = item;
                if(item.published){
                    if(!current)
                        data.prev = item;
                    else if(current._id !== item._id)
                        data.next = item;
                }
            });

            redisClient.get('fanfic_grade',function(err,response){
                if(!err && response)
                {
                    data.fanfic_grade =  JSON.parse(response);
                    finalSend();
                }
                else
                    __readSettings(finalSend,data);
            });
        };

        let likeModelMatch = {$match:{$and:[{$expr:{$eq:["$work","$$work_id"]}},{$expr:{$eq:["$targetUser","$$user_id"]}}],status:1}};
        if(req.session.user)
            likeModelMatch.$match.user = mongoose.Types.ObjectId(req.session.user._id);
        else {
            likeModelMatch.$match.ipa = req.ip;
            delete likeModelMatch.$match.$and;
            likeModelMatch.$match.$expr = {$eq:["$work","$$work_id"]};
        }

        chapterModel.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(fileName)}},
            {$lookup:{from:"work_index",as:"order",let:{chapter_id:"$_id"},pipeline:[
                        {$match:{$expr:{$eq:["$chapter","$$chapter_id"]}}},
                        {$project:{order:1,_id:1}},
                    ]}},
            {$unwind:"$order"},
            {$set:{"order":"$order.order","indexId":"$order._id"}},
            {$project:{chapter:"$$ROOT"}},
            {$lookup:{from:"user",as:"user",let:{userId:"$chapter.user"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$userId"]}}},
                        {$project:{_id:1,user:1,group:1}},
                    ]}},
            {$unwind:"$user"},
            {$lookup:{from:'works',as:"book",localField:"chapter.book",foreignField:"_id"}},
            {$unwind:"$book"},
            {$lookup:{from:"work_index",as:"index",let:{workId:"$book._id"},pipeline:[
                        {$match:{$expr:{$eq:["$work","$$workId"]}}},
                        {$sort:{order:1}},
                        {$project:{prev:1,next:1,_id:1,chapter:1,order:1}},
                    ]}},
            {$unwind:"$index"},
            {$lookup:{from:"work_chapters",as:"index.chapterInfo",let:{chapterId:"$index.chapter"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapterId"]}}},
                        {$project:{published:1,title:1,visited:1,liked:1,comments:1,wordCount:1,intro:1,fandom:1,relationships:1,characters:1,tag:1}},
                    ]}},
            {$unwind:"$index.chapterInfo"},
            {$set:{"index.visited":"$index.chapterInfo.visited","index.published":"$index.chapterInfo.published",
                    "index.title":"$index.chapterInfo.title","index.liked":"$index.chapterInfo.liked",
                    "index.wordCount":"$index.chapterInfo.wordCount",
                    "index.comments":"$index.chapterInfo.comments"}},
            {$group:{
                _id:"$_id",
                index:{$push:"$index"},
                book:{$first:"$book"},
                bookInfo:{$first:"$index"},
                user:{$first:"$user"},
                chapter:{$first:"$chapter"}}},
            {$set:{"book.visited":{$sum:"$index.visited"},"book.wordCount":{$sum:"$index.wordCount"}}},
            {$lookup:{from:"work_chapters",as:"bookInfo",let:{chapterId:"$bookInfo.chapter"},pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$chapterId"]}}},
                        {$project:{intro:1,fandom:1,relationships:1,characters:1,tag:1,warning:1}},
                    ]}},
            {$unwind:"$bookInfo"},
            {$lookup:{from:"post_like", let:{work_id:"$book._id",user_id:"$book.user"},as:"book.feedback",pipeline:[
                        likeModelMatch,
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
            {$lookup:{from:"post_comment", let:{work_id:"$book._id",chapter_id:"$chapter._id"},as:"chapterComment",pipeline:[
                        {$match:{$and:[{$expr:{$eq:["$chapter","$$chapter_id"]}},{$expr:{$eq:["$work","$$work_id"]}}],infoType:1}},
                        {$sort:{date:-1}},
                        {$limit:50},
                        {$project:{work:0,chapter:0,infoType:0}}]}},
            {$lookup:{from:"post_comment", let:{work_id:"$book._id",chapter_id:"$chapter._id"},as:"bookComment",pipeline:[
                        {$match:{$and:[{$expr:{$eq:["$chapter","$$chapter_id"]}},{$expr:{$eq:["$work","$$work_id"]}}],infoType:0}},
                        {$sort:{date:-1}},
                        {$limit:50},
                        {$project:{work:0,chapter:0,infoType:0}}]}},
            {$lookup:{from:"post_like", let:{work_id:"$book._id",user_id:"$book.user"},as:"likeList",pipeline:[
                        {$match:{$expr:{$eq:["$work","$$work_id"]},status:1,user:{$ne:null}}},
                        {$limit:50},
                        {$project:{status:1,type:1,userName:1,user:1}}]}},
        ],function(err,doc){
            if(err)
            {
                noRes = {message:err};
                console.log(err);
                finalSend();
            }
            else{
                if(doc.length>0)
                   finalProcess(doc[0]);
                else
                {
                    noRes = {message:"后端出错，请联系管理员"};
                    finalSend();
                }
            }
        });
    },

    validate:function(req,res,next){
        let sent = false;
        let request = JSON.parse(req.body.data) || null;
        let type = request.type || '-1';
        let index = req.params.fanficId;

        let response = {status:0,code:null,success:false,msg:''};

        let finalSend = function(){
            if(sent)
                return;
            res.send(JSON.stringify(response));
            sent = true;
        };

        if(!request)
            finalSend();
        else
        {
            chapterModel.findOne({_id:index}).exec()
                .then(function(doc){
                    if(!doc)
                        throw '数据库中没有这本书';
                    let md5 = crypto.createHash('md5');
                    let passCode =  md5.update(doc.passcode.code).digest('hex').toString();
                    if(request.code == passCode) {
                        response.code = passCode;
                        response.status = 1;
                        response.success = true;
                    }
                    else{
                        response.msg = '您输入的口令有误，请重新输入';
                    }
                    finalSend();
                })
                .catch(function(err){
                    response.status = 0;
                    response.msg = err;
                    finalSend();
                });
        }
    },

    tech:function(req,res){
        
    }
};

module.exports = handler;