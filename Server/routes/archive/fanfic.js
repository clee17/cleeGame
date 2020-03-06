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
    updatesModel = require(path.join(__dataModel,'cleeArchive_postUpdates')),
    errModel = require(path.join(__dataModel,'error')),
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

    deleteLikes:function(likeQuery,commentQuery){
        likeModel.deleteMany(likeQuery).exec()
            .then(function(doc){
                return commentModel.deleteMany(commentQuery).exec();
            })
            .then(function(doc){
            })
            .catch(function(err){
                let instance = new errModel;
                instance.comment = 'delete works in like and comment Model failed. query=' + JSON.stringify(query);
                instance.type = 1001;
                instance.message = err;
            })
    },

   deleteUpdates:function(query){
       updatesModel.deleteMany(query,function(err,doc){
            if(err)
            {
                let instance = new errModel;
                instance.comment = 'delete works in updates list failed; query='+ JSON.stringify(query);
                instance.type = 1002;
                instance.message = err;
            }
        });
    },

    deleteTags:function(query){
        let deleteIds = [];
        let updatesList = [];
        tagMapModel.find(query,function(err,docs){
            if(docs.length>0)
                docs.forEach(function(item){
                    deleteIds.push(item._id);
                    let update = {$inc:{'totalNum':-1}};
                    if(item.infoType === 0)
                        update.$inc.workNum= -1;
                    updatesList.push({updateOne:{'filter':{'_id':item.tag},'update':update}});
                });
            if(deleteIds.length>0)
                tagMapModel.deleteMany({_id:{$in:deleteIds}},function(err,doc){
                    if(err)
                    {
                        let instance = new errModel;
                        instance.comment = 'delete works in tagMapModel failed; query='+ JSON.stringify(query);
                        instance.type = 1003;
                        instance.message = err;
                    }
                });

            if(updatesList.length >0)
                tagModel.bulkWrite(updatesList,function(err,docs){
                    if(err)
                    {
                        let instance = new errModel;
                        instance.comment = 'update new tag counts failed. query ='+ JSON.stringify(query);
                        instance.type = 1004;
                        instance.message = err;
                    }
                });
        });
    },

    deleteAllRelevant:function(_id,infoType){
        let likeQuery = null;
        let updateQuery = null;
        let commentQuery = null;
        let tagQuery = null;
        if(infoType === 0) {
            likeQuery =  updateQuery = commentQuery = tagQuery = {work: _id};
        }
        else if (infoType === 1)
        {
            likeQuery = {chapter:_id};
            updateQuery = {contents:_id,infoType:1};
            commentQuery = {chapter:_id,infoType:1};
            tagQuery = {aid:_id,infoType:1};
        }
        if(!likeQuery || !updateQuery || !commentQuery || !tagQuery)
            return;

        handler.deleteTags(tagQuery);
        handler.deleteUpdates(updateQuery);
        handler.deleteLikes(likeQuery,commentQuery);

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
            worksModel.findOneAndDelete({_id:data.index.work},function(err,doc){
                if(err)
                {
                    result.message = err;
                    handler.finalSend(res,result);
                }
                else
                {
                    result.success = true;
                    result.message = 'delete succeed';
                    handler.finalSend(res,result);
                    handler.deleteAllRelevant(data.index.work,0);
                    let countMapUpdate = [{infoType:0,increment:-1}];
                    if(doc.status === 0 && doc.chapterCount <=1)
                        countMapUpdate.push({infoType:5,increment:-1});
                    __updateCountMap(countMapUpdate);
                }
            })
        };

        let deleteIndex = function(){
            indexModel.deleteMany({work:data.index.work},function(err){
                if(err)
                {
                    result.message = err;
                    handler.finalSend(res,result);
                }
                else
                    deleteWork();
            })
        };

        chapterModel.deleteMany({book:data.index.work,published:true},function(err,doc){
            __updateCountMap([{infoType:1,increment:-doc.deletedCount}]);
            chapterModel.deleteMany({book:data.index.work},function(err,doc){

            });
            if(err){
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
               handler.finalSend(res,result);
               handler.deleteAllRelevant(data.index.chapter,1);
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
                __updateCountMap([{infoType:1,increment:-1}]);
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
                updateQuery.$inc.visitorLiked = step;
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
               if(!err)
                      writeComment({type:2,ipa:doc.ipa});
               else
               {
                   result.message = '不是有效的游客，请刷新页面';
                   handler.finalSend(res,result);
               }
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
                if(!req.session.user || (doc.targetUser != req.session.user._id && req.session.user.userGroup < 999 && req.session.user.settings.access.indexOf(202)< 0))
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