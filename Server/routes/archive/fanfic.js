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

    deleteAllRelevant:function(id){
        // tagMap.updateMany({work:id})

        likeModel.updateMany({work:id},{work:null},function(err,doc){
            if(err){

            }
            if(doc){

            }
        })
    },

    deletePost:function(req,res){
        let indexData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            success:false
        };

        if(!__validateId(indexData.index.chapter) || !__validateId(indexData.index.work))
        {
            result.message = 'no valid id received';
            handler.finalSend(res,result);
            return;
        }

        if(indexData.infoType === 0)
            handler.deleteWork(req,res,result,indexData);
        else
            handler.deleteChapter(req,res,result,indexData);
    },


    deleteWork:function(req,res,result,data){
        if(result.sent)
            return;

        let deleteWork = function(){
            worksModel.deleteOne({_id:data.index.work},function(err){
                if(err)
                {
                    console.log(err);
                    result.message = err;
                    handler.finalSend(res,result);
                }
                else
                {
                    result.success = true;
                    result.message = 'delete succeed';
                    handler.finalSend(res,result);
                }
            })
        };

        let deleteIndex = function(){
            indexModel.deleteMany({work:data.index.work},function(err){
                if(err)
                {
                    console.log(err);
                    result.message = err;
                    handler.finalSend(res,result);
                }
                else
                    deleteWork();
            })
        };

        chapterModel.deleteMany({book:data.index.work},function(err){
            if(err){
                console.log(err);
                result.message = err;
                handler.finalSend(res,result);
            }
            else
                deleteIndex();
        });
    },

    deleteChapter:function(req,res,result,data){
       if(result.sent)
           return;

       let updateWorks = function(){
           worksModel.findOneAndUpdate({_id:data.index.work},{$inc:{chapterCount:-1}},function(err){
               if(err)
                   result.message = 'failed updating the chapterCount';
               else
                   result.message = 'successfully update the chapterCount';
               handler.deleteAllRelevant(data.index.work);
               handler.finalSend(res,result);
           });
       };

       let deleteIndex = function(){
           indexModel.findOneAndUpdate({chapter:data.index.chapter},{chapter:null},function(err){
               if(err)
               {
                   result.message = 'failed updating the index';
               }else
               {
                   result.message = "successfully update the index";
                   updateWorks();
               }
           })
       };

        chapterModel.deleteOne({_id:data.index.chapter},function(err){
            if(err)
            {
                console.log(err);
                result.message = err;
                handler.finalSend(res,result);
            }
            else{
                result.success = true;
                result.message = 'successfully deleted the chapter';
                deleteIndex();
            }
        });
    },

    likePost:function(req,res){
        let postData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            type:1,
            success:false
        };

        if(!postData)
        {
            handler.finalSend(res,result);
            return;
        }
        if(!__validateId(postData.work))
        {
            result.message = 'no valid id received';
            console.log(result);
            handler.finalSend(res,result);
            return;
        }

        result.work = postData.work;

        let user = null;
        if(req.session.user)
            user = req.session.user._id;
        result.user = user;
        if(result.user)
            result.userName = req.session.user.user;
        let updateWork = function(){
            let step = result.status? 1 : -1;
            let updateQuery = {$inc:{liked:step}};
            if(!user)
                updatedQuery.$inc.visitorLiked = step;
            worksModel.findOneAndUpdate({_id:postData.work},updateQuery,{new:true},function(err,doc){
                if(err)
                {
                    console.log(err);
                    res.message = err;
                }
                result.success = true;
                result.liked = doc.liked;
                result.visitorLiked = doc.visitorLiked;
                handler.finalSend(res,result);
            });
        };

        //完成点击或收藏；
        let searchQuery = {work:postData.work,targetUser:postData.user,type:1};
        if(user)
        {
            searchQuery.user = user;
            searchQuery.userName = req.session.user.user;
        }
        else
            searchQuery.ipa = req.ip;
        likeModel.findOneAndUpdate(searchQuery,{$bit:{status:{xor:1}}},{upsert:true,setDefaultsOnInsert: true,new:true},function(err,doc){
            if(err)
            {
                result.message = err;
                handler.finalSend(res,result);
            }
            else if(doc)
            {
                result.status = Boolean(doc.status);
                updateWork();
            }
        });
     },


    bookmarkPost:function(req,res){
        let postData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            type:2,
            success:false
        };

        if(!postData)
        {
            handler.finalSend(res,result);
            return;
        }
        if(!__validateId(postData.work))
        {
            result.message = 'no valid id received';
            handler.finalSend(res,result);
            return;
        }
        else if(!req.session.user)
        {
            result.message='您不是注册用户，不能收藏作品';
            handler.finalSend(res,result);
            return;
        }

        result.work = postData.work;

        let user = null;
        if(req.session.user)
            user = req.session.user._id;
        result.user = user;
        if(result.user)
            result.userName = req.session.user.user;
        let updateWork = function(){
            let step = result.status? 1 : -1;
            worksModel.findOneAndUpdate({_id:postData.work},{$inc:{bookmarked:step}},{new:true},function(err,doc){
                if(err)
                {
                    res.message = err;
                }
                result.success = true;
                result.bookmarked = doc.bookmarked;
                handler.finalSend(res,result);
            });
        };

        //完成收藏；
        likeModel.findOneAndUpdate({work:postData.work,user:req.session.user,userName:req.session.user.user,targetUser:postData.user,type:2},{$bit:{status:{xor:1}}},{upsert:true,setDefaultsOnInsert: true,new:true},function(err,doc){
            if(err)
            {
                result.message = err;
                handler.finalSend(res,result);
            }
            else if(doc)
            {
                result.status = Boolean(doc.status);
                updateWork();
            }
        });
    },

   commentPost:function(req,res){
       let postData = JSON.parse(lzString.decompressFromBase64(req.body.data));
       let result = {
           sent:false,
           message:'',
           success:false
       };
       let validateList = ['infoType','contents','workId','chapterId','targetUser','necc','readerId','visitorId','parent'];
       if(req.session.user)
           validateList.splice(validateList.indexOf('visitorId'),1);
       for(let i=0; i<validateList.length;++i)
       {
           if(postData[validateList[i]] === undefined)
           {
               result.message = 'not valid visitor';
               console.log(validateList[i]);
               handler.finalSend(res,result);
               return;
           }
       }
       if(!postData.necc || postData.necc != 'adw320931456t_e')
       {
           result.message = 'not valid visitor';
           handler.finalSend(res,result);
           return;
       }

       if(!req.session.user && !__validateId(postData.visitorId))
       {
           result.message = 'not valid visitor';
           handler.finalSend(res,result);
           return;
       }

       let writeComment = function(user){
             let newInstance = new commentModel;
             newInstance.infoType = postData.infoType;
             newInstance.targetUser = postData.targetUser._id;
             newInstance.targetUserName = postData.targetUser.user;
             newInstance.parent = postData.parent;
             newInstance.contents = postData.contents;
             newInstance.work = postData.workId;
             newInstance.chapter = postData.chapterId;

             if(user.type == 1)
             {
                 newInstance.user = user.user._id;
                 newInstance.userName = user.user.user;
             }
             else if(user.type == 2)
             {
                 newInstance.ipa = user.ipa;
             }

             newInstance.save(function(err){
                 if(!err){
                     result.success = true;
                     result.doc = JSON.parse(JSON.stringify(newInstance));
                     if(postData.infoType === 0)
                         worksModel.findOneAndUpdate({_id:postData.workId},{$inc:{comments:1}},{new:true},function(err,doc){
                             if(!err)
                             {
                                 result.commentCount = doc.comments;
                                 handler.finalSend(res,result);
                             }
                         });
                     else if(postData.infoType === 1)
                         chapterModel.findOneAndUpdate({_id:postData.chapterId},{$inc:{comments:1}},{new:true},function(err,doc){
                             if(!err)
                             {
                                 result.commentCount = doc.comments;
                                 handler.finalSend(res,result);
                             }
                         });
                 }
             })
       };

       if(req.session.user && req.session.user._id === postData.readerId)
           writeComment({type:1,user:req.session.user});
       else
           visitorModel.findById({_id:postData.visitorId},function(err,doc){
                      writeComment({type:2,ipa:doc.ipa});
           })


   },


    deleteComment:function(req,res){
        let postData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            success:false
        };

        if(!__validateId(postData._id)){
            result.message = '不是有效的评论索引，请重新尝试';
            handler.finalSend(res,result);
        }

        if(!req.session.user)
        {
            result.message = '您的登录已失效，无法删除该评论';
            handler.finalSend(res,result);
        }

        result._id = postData._id;
        result.infoType = postData.infoType;

        commentModel.findById(postData._id,function(err,doc){
            if(err)
            {
                result.message = '该评论不存在或已被删除';
                handler.finalSend(res,result);
            }
            else if(doc)
            {
                if(doc.targetUser != req.session.user._id)
                    result.message = '您没有删除该评论的权限';
                else if(doc.work != postData.work || doc.chapter!= postData.chapter || doc.infoType != postData.infoType)
                    result.message = '数据有误，请重新尝试';
                if(result.message === '')
                    commentModel.findByIdAndDelete(postData._id,function(err,doc){
                        if(err)
                            result.message = err;
                        if(result.message === '')
                            result.success = true;
                        if(postData.infoType === 0)
                            worksModel.findByIdAndUpdate(postData.work,{$inc:{comments:-1}},{new:true},function(err,doc){
                                if(err)
                                    result.message = 'update comment failed';
                                result.commentCount = doc.comments;
                                handler.finalSend(res,result);
                            });
                        else if(postData.infoType === 1)
                            chapterModel.findByIdAndUpdate(postData.chapter,{$inc:{comments:-1}},{new:true},function(err,doc){
                                if(err)
                                    result.message = 'update comment count failed';
                                result.commentCount = doc.comments;
                                handler.finalSend(res,result);
                            });
                    });
                else
                    handler.finalSend(res,result);
            }
        });
    },
};

module.exports = handler;