let express = require('express'),
    path = require('path'),
    worksModel = require(path.join(__dataModel,'cleeGame_works')),
    chapterModel = require(path.join(__dataModel,'cleeGame_chapter')),
    visitModel = require(path.join(__dataModel,'cleeGame_visit')),
    likeModel = require(path.join(__dataModel,'cleeGame_liked')),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let handler = {
    getWorksList:function(req,res){
        let pageId = req.body.dataPage||1;
        pageId--;
        var perPage = req.body.dataPerPage || 15;
        var subType = req.body.dataType*5+2000;
        response = {
            status:200,
            message:''
        };
       worksModel.countDocuments({type:subType}).exec()
           .then(function(count){
               response.num = count;
               return  worksModel.find({type:subType},null,{skip:pageId*perPage,limit:perPage,sort:{_id: -1}}).exec();
           })
           .then(function(docs){
               response.contents = docs;
               res.send(response);
               return;
           })
           .catch(function(err){
               response.status = 503;
               response.message = '后端出错啦';
               res.send(response);
           });
    },

    getWorkPage:function(req,res){
        let workId = req.params.worksId;
        response = {
            message: '',
            status: 200
        };

        let searchCriteria = {
            works:workId,
            type:3000
        };
        if(req.cookies && req.cookies[workId])
        {
            searchCriteria ={
                works:workId,
                _id: req.cookies[workId]
            }
        };
        let searchOption ={$inc:{visited:1}};


        visitModel.findOne({works:workId,ip:req.ip}).exec()
            .then(function(doc){
                 if(doc){
                     searchOption.$inc.visited = 0;
                 }
                 else{
                     let instance = new visitModel();
                     instance.ip = req.ip;
                     instance.works = workId;
                     instance.save();
                 }
                 return worksModel.findOneAndUpdate({_id:workId},searchOption).exec();
            })
            .then(function(doc){
                if(doc)
                {
                    response = doc.toObject();
                    return chapterModel.find({works:doc._id},'_id type wordCount title order ext4 index',{sort:{order:1}}).exec();
                }
                else{
                    response.status = 503;
                    response.message = '沒有找到该作品！';
                    throw response;
                }
            })
            .then(function(docs,err){
                if(docs){
                    response.chapters = JSON.parse(JSON.stringify(docs));
                    return chapterModel.findOneAndUpdate(searchCriteria,null,{sort:{order:1}}).populate('ext4','_id title ext4 order index').exec();
                }
                else{
                    response.status = 503;
                    response.message = '取出文章目录失败！';
                    throw response;
                }
            })
            .then(function(doc){
                if(doc)
                {
                    response.current = lzString.compressToBase64(JSON.stringify(doc));
                    response.edit = null;
                    if(__allowedIP.indexOf(req.ip) != -1)
                    {
                        response.edit = 'EDIT';
                    }
                    visitModel.findOne({works:doc._id,ip:req.ip},function(err,visitRecord){
                        if(!visitRecord){
                            let instanceChapter = new visitModel();
                            instanceChapter.works = doc._id;
                            instanceChapter.ip = req.ip;
                            instanceChapter.save();
                            chapterModel.updateOne({_id:doc._id},{$inc:{visited:1}},function(err){
                                if(err)
                                   console.log(err);
                            });
                        }
                    });
                    return likeModel.findOne({works:doc._id,ip:req.ip}).exec();
                }
                else{
                    response.status = 503;
                    response.message = '没有找到该章节';
                    throw response;
                }
            })
            .then(function(doc){
                response.ifLiked = JSON.stringify(!!doc);
                res.render('cleeGame/works.html',response);
            })
            .catch(function(err){
                err.title = '出错啦!';
                res.render('cleeGame/generic/error404.html',err);
            });
    },


    editWork: function(req,res){
        let workId = req.params.worksId;
        worksModel.findOne({_id:workId},function(err,data){
            if(err)
            {
                res.render('cleeGame/generic/error404.html', {title: '出错啦!'});
            }
            else{
                if(__allowedIP.indexOf(req.ip) != -1)
                {
                    var response = data.toObject();
                    chapterModel.find({ works:workId}, '_id ext4 type title order wordCount prev next index', {sort:{order:1}},function (err, docs) {
                        if(err)
                        {
                            res.render('/cleeGame/generic/error404.html',{title:'后端出错啦!'});
                        }
                        else
                        {
                            response.chapters = JSON.parse(JSON.stringify(docs));
                            res.render('cleeGame/admin/workEdit.html',response);
                        }

                    });
                }
                else
                {
                    res.render('/cleeGame/generic/forbidden505.html');
                }
            }
        });
    },

    updateWork: function(req,res){
        var updateDoc = JSON.parse(lzString.decompress(req.body.meta));
        var response={
            message: '',
            status: 200
        };
        var id = updateDoc._id;
        delete updateDoc._id;
        worksModel.updateOne({_id:id},updateDoc,function(err){
            if(err)
            {
               response.message = '出错啦!';
               res.send(response);
            }
            else{
                if(__allowedIP.indexOf(req.ip) != -1)
                {
                    response.message = '更新成功!';
                    response.status = 500;
                    res.send(response);
                }
                else
                {
                    response.message = '更新失败!';
                    response.status = 503;
                    res.send(response);
                }
            }
        });
    },


    addVolume:function(req,res){
        var updateDoc = JSON.parse(lzString.decompress(req.body.meta));
        var response={
            message: '',
            status: 200
        };
        var instance = new chapterModel();
        instance.works = updateDoc.works;
        instance.title = updateDoc.title;
        instance.type = updateDoc.type;
        instance.order = updateDoc.order;
        instance.tag = updateDoc.tag;
        instance.contents=updateDoc.contents;
        instance.save(function(err){
            if(err)
            {
                response.message='存储失败';
                response.status = 503;
                res.send(response)
            }
            else{
                worksModel.findOneAndUpdate({_id:instance.works},{$inc:{ext1:1}},function(err,data){
                    if(err)
                    {
                        response.message='增加卷数索引失败';
                        response.status = 510;
                        res.send(response);
                    }
                    else{
                        response.message='增加卷数成功';
                        response.status=500;
                        res.send(response);
                    }
                });
            }

        })
    },

    addChapter:function(req,res){
        var updateDoc = JSON.parse(lzString.decompress(req.body.meta));
        var response={
            message: '',
            status: 200
        };
        var instance = new chapterModel();
        instance.works = updateDoc.works;
        instance.title = updateDoc.title;
        instance.type = updateDoc.type;
        instance.order = updateDoc.order;
        instance.tag = updateDoc.tag;
        instance.contents=updateDoc.contents;
        instance.wordCount= updateDoc.wordCount;
        instance.ext4 = updateDoc.ext4;
        instance.prev = updateDoc.prev || null;
        instance.next = updateDoc.next || null;
        instance.save()
            .then(function(chapter){
                if(chapter)
                {
                    response.result = chapter._id;
                    chapterModel.findOneAndUpdate({_id:instance.prev}, {next:chapter._id});
                    chapterModel.findOneAndUpdate({_id:instance.next},{prev:chapter._id});
                    return chapterModel.aggregate([{$match:{works:chapter.works}},
                        {$sort:{order:1}},
                        {$group:{_id:"$type",totalWordCount:{$sum:"$wordCount"},totalCount:{$sum:1}}}
                        ]).exec();
                }
                else{
                    response.message='存储失败!';
                    response.status = 503;
                }
            })
            .then(function(doc){
                if(doc)
                {
                    let chapter = null;
                    let volume = null;
                    for(var i=0; i<doc.length;++i)
                    {
                        if(doc[i]._id == 3005)
                            chapter = doc[i];
                        else if(doc[i]._id == 3000)
                            volume = doc[i];
                    }
                    return worksModel.findOneAndUpdate({_id:instance.works},{$set:{wordCount:chapter.totalWordCount,chapCount:chapter.totalCount,ext1:volume.totalCount},$currentDate:{updated:"Date"}}).exec();
                }
                else{
                    response.message ='更新卷链接失败';
                    response.status = 503;
                }
            })
            .then(function(doc){
                if(doc){
                    response.message = '增加新章成功';
                    response.status = 500;
                    res.send(response);
                    return;
                }
                else{
                    response.message = '更新作品信息失败';
                    response.status = 503;
                    throw response;
                }
            })
            .catch(function(err){
                if(!err.status)
                    err.status = 503;
                if(!err.message)
                    err.message = '后端出错啦';
                console.log(err);
                  res.send(err);
        });
    },

    turnToChap: function(req,res){
       var searchCriteria = JSON.parse(lzString.decompressFromBase64(req.body.meta));
       response = {
           message: '',
           status: 200
       };

       likeModel.findOne({works:searchCriteria._id,ip:req.ip}).exec()
           .then(function(doc){
               response.ifLiked = !!doc;
               return  chapterModel.findOne(searchCriteria).populate('ext4','_id title ext4 order index').exec();
           })
           .then(function(doc){
               if(doc) {
                   response.status = 500;
                   response.message = '成功取得';
                   response.current = JSON.parse(JSON.stringify(doc));
                  return visitModel.findOne({works: doc._id, ip: req.ip}).exec();
               }
               else{

                   response.message = '没有获取到当前页面';
                   response.status = 503;
                   throw response;
               }
           })
           .then(function(rec){
               if (!rec) {
                   let instance = new visitModel();
                   instance.ip = req.ip;
                   instance.works = response.current._id;
                   instance.save();
                   chapterModel.updateOne({_id: response.current._id}, {$inc: {visited: 1}}, function (err, doc) {
                       if (doc)
                           response.current.visited++;
                       res.send(lzString.compressToBase64(JSON.stringify(response)));
                   });
               } else {
                   res.send(lzString.compressToBase64(JSON.stringify(response)));
               }
           })
           .catch(function(err){
               console.log(err);
               if(!err.status)
                   err.status = 503;
               if(!err.message || err.message=='')
                   err.message= '后端出错啦';
               res.send(err);
           });
    },



    likeIt: function(req,res){
        var requestData = JSON.parse(lzString.decompressFromBase64(req.body.meta));
        response = {
            message: '',
            status: 200,
            liked:false
        };
        likeModel.findOne({ip:req.ip,works:requestData._id}).exec()
            .then(function(doc){
                if(doc)
                {
                    response.liked = true;
                    response.message = '您已经为该章点过赞';
                    status = 503;
                    throw response;
                }
                else
                    return chapterModel.findOneAndUpdate({_id:requestData._id},{$inc:{liked:1}}).exec();
            })
            .then(function(doc){
                if(doc)
                {
                    response.likeCount = doc.liked+1;
                    response.liked = true;
                    response._id = doc._id;
                    response.status = 500;
                    response.message = '感谢您的喜欢';
                    let instance = new likeModel();
                    instance.ip = req.ip;
                    instance.works = doc._id;
                    instance.save();
                    res.send(response);
                    return;
                }
                else{
                    response.message = '没有找到该作品！';
                    response.status = 503;
                    response.liked = false;
                    throw response;
                }
            })
            .catch(function(err){
                res.send(err);
            })
    },

    cancelLike: function(req,res){
        var requestData = JSON.parse(lzString.decompressFromBase64(req.body.meta));
        response = {
            message: '',
            status: 200,
            liked:false
        };
        likeModel.deleteOne({ip:req.ip,works:requestData._id}).exec()
            .then(function(doc){
                response.liked = false;
                response.message = '您已经取消点赞';
                return chapterModel.findOneAndUpdate({_id:requestData._id},{$inc:{liked:-1}}).exec();
            })
            .then(function(doc){
                if(doc)
                {
                    response.likeCount = doc.liked-1;
                    response._id = doc._id;
                    response.status = 500;
                    res.send(response);
                }
                else{
                    response.message = '没有找到该作品！';
                    response.status = 503;
                    response.liked = false;
                    throw response;
                }
            })
            .catch(function(err){
                res.send(err);
            })
    }
};

module.exports = handler;