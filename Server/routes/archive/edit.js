let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    chapterModel = require(path.join(__dataModel,'cleeArchive_fanfic')),
    worksModel = require(path.join(__dataModel,'cleeArchive_works'));

let handler = {
    newFanfic:function(req,res,next){
        let authorize = false;
        if(req.session.user)
        {
            if(req.session.user.group.indexOf(999) != -1)
                authorize = true;
            else if(req.session.user.group.indexOf(101) != -1)
                authorize = true;
        }

        if(!req.session.user)
            __renderError(req,res,'您尚未登录，请先登录以发表文章。');
        else if(req.session.user && !authorize)
            __renderError(req,res,'您的用户权限太低，无法发表文章，请联系站主确认您的权限。');
        else if(req.session.user && authorize)
            __renderIndex(req,res,{viewport:'/dynamic/booknew',controllers:['/view/cont/edit_con.js'],services:['/view/cont/fanficService.js','/view/cont/userService.js','/view/cont/filterWord.js'],styles:['archive/edit']});
        else
            __renderError(req,res,'因为不知名的原因导致您无法发表文章，请联系站主。');
    },

    fanficEdit:function(req,res){
        let requestIndex = req.query.id;
        if(!__validateId(requestIndex))
            __renderError(req,res,'没有收到任何可编辑的章节索引');
        else {
            indexModel.findOne({_id: requestIndex}, function (err, doc) {
                if (err || !doc)
                    __renderError(req, res, '数据库中没有该章节');
                else {
                    if (req.session.user._id != doc.chapter.user)
                        __renderError(req, res, '您没有编辑该章节的权限');
                    else {
                        requestIndex = '?id=' + requestIndex;
                        __renderIndex(req, res, {
                            viewport: '/dynamic/bookedit' + requestIndex,
                            controllers: ['/view/cont/edit_con.js'],
                            services: ['/view/cont/fanficService.js','/view/cont/userService.js','/view/cont/filterWord.js'],
                            styles: ['archive/edit']
                        });
                    }
                }
            }).populate('chapter');
        }
    },

    fanficGet:function(req,res){
        let indexData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let proceed = 0;
        let data = {
            success:false,
            message:'',
            chapter:null,
            finished:false,
            isFirst:false,
        };

        data.isFirst = (indexData.prev == null && indexData.order == 0);

        let finalSend = function(){
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        };

        let nextS = function(){
            if(sent)
                return;

            if(data.finished)
                finalSend();
            else if(!indexData.chapter)
                createChapter();
            else if(!data.chapter)
                getChapter();
        };


       let createChapter = function(){
           if(!indexData._id)
           {
               data.finished = true;
               data.message = '没有收到章节索引记录';
               nextS();
               return;
           }
           let userId = req.session.user;
           if(userId)
               userId = userId._id;
           chapterModel.findOneAndUpdate({book:indexData.work,linked:false,user:userId},{},{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
               .then(function(doc){
                   if(!doc)
                       throw '创建章节失败';
                   indexData.chapter = JSON.parse(JSON.stringify(doc));
                   return indexModel.findOneAndUpdate({_id:indexData._id},{chapter:doc._id},{new:true}).exec();
               })
               .then(function(doc){
                   if(!doc)
                       throw '更新章节索引失败';
                   return chapterModel.updateOne({_id:doc.chapter},{linked:true},{new:true}).exec();
               })
               .then(function(doc){
                   if(!doc)
                       throw '更新章节与索引链接失败';
                   nextS();
               })
               .catch(function(err){
                   data.finished = true;
                   data.success = false;
                   data.message = err;
                   nextS();
               })
       };

        let getChapter = function(){
            indexModel.findOne({_id:indexData._id}).populate('chapter').exec()
                .then(function(doc){
                    if(!doc)
                        throw '数据库中没有该文章索引';
                    data.chapter = JSON.parse(JSON.stringify(doc));
                    data.success = true;
                    data.message = '成功获取文章';
                    data.finished = true;
                    nextS();
                })
                .catch(function(err){
                    data.success = false;
                    data.message = err;
                    data.finished = true;
                    nextS();
                });
        };

        nextS();
    },


    saveChapter:function(req,res){
        let chapterData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let data = {
            message:'',
            success:false
        };
        let id = chapterData._id || null;
        delete chapterData._id;
        chapterModel.findOneAndUpdate({_id:id},chapterData,{new:true}).exec()
            .then(function(doc){
                if(!doc)
                    throw '数据库中没有该章节';
                data.success = true;
                data.chapter = JSON.parse(JSON.stringify(doc));
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            })
            .catch(function(err){
                console.log(err);
                data.message = err;
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            });
    },

    addChapter:function(req,res){
        let indexData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let process = 0;
        let data = {
            message:'',
            insertId:indexData.prevIndex,
            success:false
        };

        let proceed = function() {
            if (process == 0)
                saveIndex();
            else if(process == 1)
                updateIndex();
            else if(process == 2)
                updateBook();
        };

        let send = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        };

        let saveIndex = function(){
            let index = new indexModel();
            index.prev = indexData.prev;
            index.next = indexData.next;
            index.order = indexData.currentOrder+1;
            index.work = indexData.work;
            index.save(function(err,index){
                if(err){
                    data.message = err;
                    send();
                }
                else{
                    data.newIndex = JSON.parse(JSON.stringify(index));
                    process = 1;
                    proceed();
                }
            })
        };

        let updateIndex = function(){
            let bulkArr = [];
            if(indexData.prev)
                bulkArr.push({updateOne:{'filter':{'_id':indexData.prev},'update':{'next':data.newIndex._id}}});
            if(indexData.next)
                bulkArr.push({updateOne:{'filter':{'_id':indexData.next},'update':{'prev':data.newIndex._id}}});
            bulkArr.push({updateMany:{'filter':{'order':{$gte:data.newIndex.order},'_id':{$not:{$in:[data.newIndex._id]}}},'update':{$inc:{order:1}}}});
            indexModel.bulkWrite(bulkArr)
                .then(function(result){
                    process = 2;
                    proceed();
                })
                .catch(function(err){
                    console.log(err);
                    data.message = '更新原目录错误'+err;
                    send();
                })
        };

        let updateBook = function(){
            indexModel.find({work:indexData.work}).exec()
                .then(function(docs){
                    return worksModel.updateOne({_id:indexData.work},{chapterCount:docs.length},{new:true}).exec()
                })
                .then(function(doc){
                    if(!doc)
                        throw '更新书籍信息错误';
                    data.success =  true;
                    data.bookInfo = JSON.parse(JSON.stringify(doc));
                    send();
                })
                .catch(function(err){
                    console.log(err);
                    data.message = '更新目录错误'+err;
                    send();
                })
        };

        proceed();
    },


    saveBook:function(req,res){
        let bookData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let data = {
            message:'',
            success:false
        };
        let id = bookData._id || null;
        delete bookData._id;
        worksModel.findOneAndUpdate({_id:id},bookData,{new:true}).exec()
            .then(function(res){
                if(!res)
                    throw '数据库中没有这本书';
                data.success = true;
                data.book = res;
                delete data.book.user;
                delete data.book.__v;
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            })
            .catch(function(err){
                data.message = err;
                res.send(lzString.compressToBase64(JSON.stringify(data)));
            });
    },

    fanficPreview:function(req,res){
        let previewData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let response = {
            message:'',
            success:false
        };
        if(req.session.user)
        {

            let readerId = req.session.user? req.session.user._id :  null;
            previewData.readerId = readerId;
            previewData.codeMatch = true;
            if(previewData.index.length == 1 && previewData.book.status == 0)
                previewData.title = previewData.book.title;
            else
                previewData.title = __chapterCount(previewData.currentIndex.order)+'     '+previewData.chapter.title;
            previewData.user = req.session.user;
            req.session.user.previewData = JSON.parse(JSON.stringify(previewData));
            response.success = true;
        }
       res.send(lzString.compressToBase64(JSON.stringify(response)));
    },

    publish:function(req,res){
        let saveData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let sent = false;
        let data = {
            message:'',
            success:false
        };
        if(!saveData.published)
            saveData.chapter.date = Date.now();
        saveData.chapter.updated = Date.now();
        let updateIndex = [];
        updateIndex.push(saveData.chapter._id);
        saveData.index.map(function(item,i,arr){
            if(item.chapter && saveData.ifAll && updateIndex.indexOf(item.chapter._id) ==-1)
                updateIndex.push(item.chapter._id);
        });



        if(!saveData.book.published)
        {
            saveData.book.published = true;
            saveData.book.date = Date.now();
            saveData.book.updated = Date.now();
        }
        else{
            saveData.book.updated = Date.now();
        }

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            res.send(lzString.compressToBase64(JSON.stringify(data)));
        };

        chapterModel.findOneAndUpdate({_id:saveData.chapter._id},saveData.chapter,{new:true}).exec()
            .then(function(doc){
                if(!doc)
                    throw '发布章节失败';
                saveData.book.wordCount = 0;
                saveData.index.map(function(item,i,arr){
                    if(item.chapter && item.chapter.published)
                        saveData.book.wordCount += item.chapter.wordCount;
                });
                return worksModel.findOneAndUpdate({_id:saveData.book._id},saveData.book,{new:true}).exec();
            })
            .then(function(docs){
                if(!docs)
                    throw '发布书籍失败';
                return chapterModel.updateMany({_id:{$in:updateIndex},published:false},{published:true,Date:Date.now()}).exec();
            })
            .then(function(docs){
                if(!docs)
                    data.message += '没有成功发布所有章节目录';
                data.success = true;
                data._id = saveData.chapter._id;
                finalSend();
            })
            .catch(function(err){
                console.log(err);
                data.message = err;
                data.success = false;
                finalSend();
            });
    },

    previewPage:function(req,res,next){
        let sent = false;
        let grade = [{
            "code": 0,
            "refer":"全年龄向"
        },{
            "code": 1,
            "refer": "nc-17"
        },{
            "code": 2,
            "refer": "nc-21"
        }];

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            if(req.session.user && req.session.user.previewData)
            {
                let data = JSON.parse(JSON.stringify(req.session.user.previewData));
                data.grade = grade;
                delete req.session.user.previewData;
                res.render('cleeArchive/fanfic.html',data);
            }
            else
                next();
        };

        redisClient.get('grade',function(err,doc){
                if(!err)
                    grade =  JSON.parse(doc);
                finalSend();
            });
    },
};

module.exports = handler;