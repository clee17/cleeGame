let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let boardModel = require(path.join(__dataModel,'board')),
    threadModel = require(path.join(__dataModel,'board_thread')),
    userGroupModel = require(path.join(__dataModel,'board_usergroup')),
    userModel = require(path.join(__dataModel,'board_user')),
    replyModel = require(path.join(__dataModel,'board_message')),
    htmlModel = require(path.join(__dataModel,'cleeContents_board'));


let model ={
    'thread':threadModel,
    'board':boardModel,
    'reply':replyModel
}

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    entry:function(req,res){
        let boardId = req.params.boardId;

        if(!boardId || !__validateId(boardId)){
            __renderSubPage(req,res,'error',{error:_errInfo[22]});
            return;
        }

        boardModel.findOne({_id:boardId},function(err,board){
            if(err){
                __renderSubPage(req,res,'error',{error:err.message});
            }else if(!board){
                __renderSubPage(req,res,'error',{error:_errInfo[23]});
            }else{
                let allowNew = parseInt('000001',2);
                let allowReply = parseInt('0000010',2);
                let allowUpdate = parseInt('000100',2);

                let detail = JSON.parse(JSON.stringify(board));
                detail.allowNew = detail.setting & allowNew >0;
                detail.allowReply = detail.setting & allowReply >0;
                detail.allowUpdate = detail.setting & allowUpdate >0;
                let defaultCategory = {
                    cn:'通用',
                    en:'general'
                };
                if(!detail.category || detail.category.length === 0){
                    detail.category = [{
                        name: __packMultiLang(defaultCategory),
                        order:0}
                    ];
                }
                for(let i=0;i<detail.category.length;++i){
                    detail.category[i].name = encodeURIComponent(__multiLang(detail.category[i].name,req.ipData));
                }

                let searchgroup = {ips:req.ip,board:detail._id};
                let searchuser = {ip:req.ip,user:null,board:detail._id};
                if(req.session.user) {
                    searchgroup = {users: req.session.user._id,board:detail._id};
                    searchuser = {user:req.session.user._id,board:detail._id};
                }


                let process = function(type,results){
                    if(type === 'usergroup'){
                        let temp = results.length >0? 0 : -1;
                        for(let i=0; i<results.length;++i)
                            temp = temp | results[i].access;
                        detail.usergroup = temp;
                    }
                    if(type === 'user')
                        detail.user = results.length>0? results[0].access : -1;

                    if(type === 'visitor')
                        detail.visitor = results.length>0? results[0].access : 2;

                    if(detail.user !== undefined && detail.usergroup !== undefined && detail.visitor !== undefined){
                        __renderSubPage(req,res,'board',detail);
                    }
                };


                userGroupModel.find(searchgroup,function(err,response){
                    if(!err){
                        process('usergroup',response);
                    }else
                        __renderSubPage(req,res,'error',err.message);
                });

                userGroupModel.find({title:'visitor',board:detail._id},function(err,response){
                    if(!err){
                        process('visitor',response);
                    }else
                        __renderSubPage(req,res,'error',err.message);
                });

                userModel.find(searchuser,function(err,response){
                    if(!err){
                        process('user',response);
                    }else
                        __renderSubPage(req,res,'error',err.message);
                });

            }
        });
    },

    loadContents:function(details,contentsId,callback){
        let findHtml = function(details,listItem){
            if(details.thread.html.toString() === listItem._id.toString()){
                details.thread.html = lzString.compressToBase64(listItem.contents);
                return;
            }
            let replies = details.replies;
            for(let i=0; i<replies.length;++i){
                if(listItem.link.toString() === replies[i]._id.toString()){
                    replies[i].html = lzString.compressToBase64(listItem.contents);
                }
            }
        };

        htmlModel.find({link:{$in:contentsId}},function(err,htmlList) {
            if (err)
                __renderError(req, res, err.message);
            else {
                for(let i=0;i<htmlList.length;++i){
                    findHtml(details,htmlList[i]);
                }
                details.loaded.contentsLoaded = true;
                if(callback)
                    callback();
            }
        });
    },

    loadUserAccess:function(board,user,callback){
        if(!user || !board ){
            console.log('ERROR, no valid board id or user id received!!');
            if(callback)
                callback();
        }else{
            let access = 0;
            userModel.find({board:board,user:user}).exec()
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    return userGroupModel.find({board:board,users:user}).exec();
                })
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    redisClient.set(board+user,JSON.stringify({access:access,message:null,lastUpdated:Date.now()}));
                    if(callback)
                        callback();
                })
                .catch(function(err){
                    console.log(err);
                    redisClient.set(board+user,JSON.stringify({access:0,message:err.message,lastUpdated:Date.now()}));
                    if(callback)
                        callback();
                })
        }
    },

    threadDetail:function(req,res,type){
        let threadId = req.params.threadId;
        let pageId = req.query.pid || 1;
        if(!threadId || !__validateId(threadId)){
            __renderError(req,res,_errInfo[29]);
            return;
        }

        let details ={
            loaded:{
                theadLoaded:false,
                contentsLoaded:false,
                userRoleLoaded:false
            }
        };

        let send = function(){
            for(attr in details.loaded){
                if(!details.loaded[attr])
                    return;
            };
            details.editor = true;
            if(type === 'events'){
            }
            else
                __renderIndex(req,res,{viewport:'/sub/board_thread',
                    modules:['/view/modules/pageIndex.js'],
                    controllers:['/view/cont/board_thread_info.js','/view/cont/board_con.js'],
                    services:['view/cont/boardService.js','/view/cont/filterWord.js'],variables:details});
        };

        let replyFecth = function(thread){
            let maxCount = thread.replied - thread.deleted;
            if(maxCount >0 && pageId > Math.ceil(maxCount/20))
                pageId = Math.ceil(maxCount /20);
            else if(pageId < 1)
                pageId = 1;

            let perPage = 20;
            if(pageId === 1)
                perPage --;

            let contentsId = [];

            if(pageId === 1)
                contentsId.push(thread._id);

            if(maxCount >0){
                replyModel.find({thread:thread._id},null,{sort:{createdAt:1},limit:perPage,skip:(pageId-1)*20},function(err,replies) {
                    if(err)
                        __renderError(req,res,err.message);
                    else{
                        details.replies = JSON.parse(JSON.stringify(replies));
                        contentsId = contentsId.concat(replies.map(function(value){return value._id}));
                        handler.loadContents(details,contentsId,send);
                    }
                }).populate({path:'author',select:'_id user'});
            }else{
                handler.loadContents(details,contentsId,send);
            }
        }

        let userRoleFetch = function(){
            if(!req.session.user){
                details.loaded.userRoleLoaded = true;
                send();
                return;
            }
            let board = details.thread.board._id;
            let user = req.session.user._id;
            let index = board+user;
            let settings = req.cookies[board.toString()+user.toString()];

            if(user === details.thread.board.owner || req.session.user.isAdmin){
                details.loaded.userRoleLoaded = true;
                res.cookie(index,lzString.compressToBase64(JSON.stringify({access:parseInt('111111111111111111',2),lastUpdated:Date.now(),message:null})));
                send();
                return;
            }

            try{
                settings = JSON.parse(lzString.decompressFromBase64(settings));
                let dateNow = Date.now();
                if(settings.lastUpdated >= (dateNow - 1*60*1000)) {
                    details.loaded.userRoleLoaded = true;
                    send();
                    return;
                }
            }catch(err){
            }

            let getUserFromRedis = function(){
                redisClient.get(index,function(err,result) {
                    if(result)
                        result =  JSON.parse(result);
                    if(result.lastUpdated <= Date.now() - 1*60*1000){
                        res.cookie(index,lzString.compressToBase64(JSON.stringify(result)));
                        details.loaded.userRoleLoaded = true;
                        send();
                    } else if(!err)
                        handler.loadUserAccess(board,user,getUserFromRedis);
                    else if(err){
                        details.loaded.userRoleLoaded = true;
                        send();
                    }
                });
            }

            getUserFromRedis();
        };

        threadModel.findOneAndUpdate({_id:threadId},{$inc:{visited:1}},null,function(err,thread){
            if(err)
                __renderError(req,res,err.message);
            else if(!thread)
                __renderError(req,res,_errInfo[29]);
            else{
                details.thread = JSON.parse(JSON.stringify(thread));
                let temp = details.thread;
                for(let i=0; i<temp.board.category.length;++i){
                    temp.board.category[i].name = encodeURIComponent(__multiLang(temp.board.category[i].name,req.ipData));
                }
                temp.board.title = escape(temp.board.title);
                details.replies = [];
                //关联所有回复
                details.thread.isFirst = pageId === 1;
                details.userInfo = {};
                details.userInfo.name = req.session.user? req.session.user.user : _infoAll[21];
                details.loaded.theadLoaded = true;
                if(req.session.user){
                    userRoleFetch(thread);
                    replyFecth(thread);
                }else{
                    details.loaded.userRoleLoaded = true;
                    replyFecth(thread);
                }
            }
        }).populate([{path:'author',select:'_id user'},{path:'board',select:'category title _id visited replied owner'}]);

    },

    thread_main:function(req,res){
        handler.threadDetail(req,res,'main');
    },

    threads: function(req,res){
        let response = {
            sent: false,
            success: false,
            message: '',
        };
        let pageId = 1;
        let setting = 0;
        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
            pageId =  received.pageId;
            setting = received.board_setting;
            let board_id = received.board_id;
            response.board_id = board_id;
        }catch(err){

        }
        pageId --;
        let aggregate = [
            {$match: {}},
            {$sort: {updatedAt: -1}},
            {$skip:35*pageId},
            {$limit:35},
            {$lookup:{from:"user",localField:"author",foreignField:"_id",as:"author"}},
            {$unwind:{path: "$author", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'user_role',as:"roleGroup",let:{user_id:"$user"},pipeline:[
                        {$match:{user:"$$userId"}},
                        {$lookup:{from:"role",localField:"role",foreignField:"_id",as:"detail"}},
                        {$unwind:{path: "$detail", preserveNullAndEmptyArrays: true }},
                    ]}}
        ];

        let allowNew = parseInt('000001',2) & setting >0;
        let allowReply = parseInt('0000010',2) & setting >0;
        let allowUpdate = parseInt('000100',2) & setting >0; //按照回复事件排序

        if(!allowUpdate)
            aggregate[1] = {$sort:{createdAt:-1}};
        threadModel.aggregate(aggregate).exec()
            .then(function(result){
                response.success = true;
                response.result = JSON.parse(JSON.stringify(result));
                handler.finalSend(res,response);
            })
            .catch(function(err){
                console.log(err);
            })
    },

    addThread:function(req,res,response,info){
        let thread = new threadModel();
        thread.ip = info['ip'];
        thread.author = info['author'];
        thread.title = info['title'];
        thread.board = info['board_id'];
        thread.grade = info['grade'];
        thread.category = info['category'];
        thread.save()
            .then(function(){
                let contents = new htmlModel();
                contents.link = thread._id;
                contents.contents = info['contents'];
                response.thread = JSON.parse(JSON.stringify(thread));
                return contents.save();
            })
            .then(function(article){
                response.success = true;
                response.thread.html = article._id;
                if(response.thread.author)
                    response.thread.author = {_id:info['author'], user:req.session.user.user};
                threadModel.findOneAndUpdate({_id:response.thread._id},{html:article._id},{new:true},function(err,result){
                });
                boardModel.findOneAndUpdate({_id:response.thread.board},{$inc:{threads:1}},null,function(err,result){});
                handler.finalSend(res,response);
            })
            .catch(function(err){
                response.success = false;
                response.message = err.message;
                handler.finalSend(res,response);
            })
    },

    addReply:function(req,res,response,info){
        let reply = new replyModel();
        reply.ip = info['ip'];
        reply.author = info['author'];
        reply.thread = info['thread'];
        reply.board = info['board_id'];
        reply.grade = info['grade'];
        threadModel.findOne({_id:reply.thread}).exec()
            .then(function(thread){
                if(!thread)
                    throw _errInfo[32];
                else {
                    reply.threadIndex = thread.replied +1;
                    return reply.save();
                }
            })
            .then(function(){
                let contents = new htmlModel();
                contents.link = reply._id;
                contents.contents = info['contents'];
                response.reply = JSON.parse(JSON.stringify(reply));
                return contents.save();
            })
            .then(function(article){
                response.success = true;
                response.reply.html = lzString.compressToBase64(article.contents);
                if(response.reply.author)
                    response.reply.author = {_id:info['author'], user:req.session.user.user};
                threadModel.findOneAndUpdate({_id:info['thread']},{$inc: {replied:1},repliedAt:Date.now()},{new:true},function(err,result){
                });
                replyModel.findOneAndUpdate({_id:reply._id},{contents:article._id},null,function(err,result){});
                handler.finalSend(res,response);
            })
            .catch(function(err){
                response.success = false;
                response.message = err.message;
                handler.finalSend(res,response);
            })
    },

    checkPublishValidate:function(req,res,response,info,identity,callback){
        if(req.session.user && req.session.user.isAdmin){
            callback(req,res,response,info);
        }else if(req.session.user){
            let access = 0;
            boardModel.findOne({_id:info['board_id']}).exec()
                .then(function(result){
                    if(!result)
                        throw _errInfo[23];
                    else if(req.session.user && req.session.user._id.toString() === result._id.toString())
                        callback(req,res,response,info);
                    else if( (identity & result.access) > 0)
                        return  userModel.find({board:info['board_id'],user:info['user']}).exec()
                    else
                        throw _errInfo[31];
                })
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    if((access & identity) >0){
                        callback(req,res,response,info);
                    }else
                        return userGroupModel.find({board:info['board_id'],users:info['user']}).exec();
                })
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    if((access & identity) >0) {
                        callback(req,res,response,info);
                    }
                })
                .catch(function(err){
                    response.message =err.message;
                    response.success = false;
                    handler.finalSend(response.message);
                })
        }else{
            let timeNow = Date.now();
            let timePast = timeNow -  1000*60*10;
            let maxLimit = 5;
            model[info['model']].countDocuments({createdAt:{$lte:timeNow,$gte:timePast},ip:req.ip},function(err,count){
                 if(count >= maxLimit){
                      response.success = false;
                      response.message = _errInfo[30];
                      response.errorType = 'alert';
                     handler.finalSend(res,response);
                 }else
                     callback(req,res,response,info);

            });
        }
    },

    depackInfo:function(info,received){
        info['board_id'] = received.board_id || "";
        if(info['board_id'] === "")
            info['board_id'] = null;

        info['contents'] = received.contents || "";
        info['contents'] = lzString.decompressFromBase64(info['contents']);

        info['author'] = received.author || null;
        if(info['author'] === '')
            info['author'] = null;
        else if(!__validateId(info['author']))
            info['author'] = null;

        info['grade'] = received.grade === undefined? 99: received.grade;
    },

    submitThread:function(req,res){
        let info = {
            board_id: '',
            title:"",
            contents:"",
            ip:req.ip,
        };

        let response = {
            sent:false,
            message:'',
            success:false,
        }
        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
            if(req.session.user && received.author !== req.session.user._id.toString())
                throw Error(_errAll[23]);
            if(!received.board_id || !__validateId(received.board_id))
                throw Error(_errInfo[24]);
            handler.depackInfo(info,received);

            info['title'] = received.title || "";
            info['title'] = unescape(info['title']);

            info['category'] = received.category === undefined?  0 : received.category;
         }catch(err){
            response.message = err.message;
            handler.finalSend(res,response);
            return;
        }

        info['model'] = 'thread';

        handler.checkPublishValidate(req,res,response,info,parseInt('000001 ',2),handler.addThread);
    },

    submitReply:function(req,res){
        let info = {
            board_id: '',
            title:"",
            contents:"",
            ip:req.ip,
        };

        let response = {
            sent:false,
            message:'',
            success:false,
        }
        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
            if(req.session.user && received.author !== req.session.user._id.toString())
                throw Error(_errAll[23]);
            if(!received.board_id || !__validateId(received.board_id))
                throw Error(_errInfo[24]);
            handler.depackInfo(info,received);

            info['thread'] = received.thread || null;
            if(info['thread'] === '')
                info['thread'] = null;
            else if(info['thread'] && !__validateId(info['thread']))
                info['thread'] = null;

            if(!info['thread'])
                throw Error(_errInfo[32]);
        }catch(err){
            response.message = err.message;
            handler.finalSend(res,response);
            return;
        }

        info['model'] = 'reply';
        handler.checkPublishValidate(req,res,response,info,parseInt('000010 ',2),handler.addReply);
    },

    validateAccess:function(req,res,received,callback,identity,response){
        if(!req.session.user){
            response.message = _errInfo[28];
            handler.finalSend(res,response);
        }else if(req.session.user && req.session.user.isAdmin){
            callback(received);
        }else if(req.session.user && req.session.user._id.toString() === received.author){
            callback(received);
        }else if(req.session.user){
            let access = 0;
            userModel.find({board:received.board_id,user:req.session.user._id}).exec()
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    if((access & identity) >0){
                        callback(received);
                    }else
                        return userGroupModel.find({board:received.board_id,users:req.session.user._id}).exec();
                })
                .then(function(results){
                    for(let i=0;i<results.length;++i)
                        access = access | results[i].access;
                    if((access & identity) >0) {
                        callback(received);
                    }else
                        throw Error(_errInfo[34]);
                })
                .catch(function(err){
                    response.message = err.message;
                    response.success = false;
                    handler.finalSend(res,response);
                })
        }
    },

    deleteThread:function(req,res){
        let response = {
            sent:false,
            message:'',
            success:false,
        };

        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
            if(!received.board_id || !__validateId(received.board_id))
                throw Error(_errInfo[24]);

            if(!received.id || !__validateId(received.id))
                throw Error(_errInfo[24]);

            response.board = received.board_id;
            response._id = received.id;
            let checkSuccess = function(result,type){
                response[type] =  true;
                if(response['thread'] && response['reply']){
                    response.success = true;
                    handler.finalSend(res,response);
                }
            };

            let deleteThread = function(received){
                threadModel.findOneAndDelete({board:received.board_id,_id:received.id},function(err,doc){
                    if(err)
                        throw Error(err.message);
                    else
                        htmlModel.deleteOne({link:doc._id},function(err,result){
                            if(err)
                                throw Error(err.message);
                            else
                                checkSuccess(result,'thread');
                        });
                });

                replyModel.find({thread:received.id},{_id:1},null,function(err,result){
                    if(err)
                        throw Error(err.message);
                    else
                        htmlModel.deleteMany({link:{$in:result.map(function(value){return value._id})}},function(err){
                            if(err)
                                throw Error(err.message);
                            else
                                checkSuccess(result,'reply');
                        });
                });

                boardModel.findOneAndUpdate({_id:received.board_id},{$inc:{threads:-1}},null,function(err,result){
                    if(err)
                        throw Error(err.message);
                })
            };

            handler.validateAccess(req,res,
                received,
                deleteThread,
                parseInt('010000',2),
                response);
        }catch(err){
            response.message = err.message;
            response.success = false;
            handler.finalSend(res,response);
        }
    },

    deleteReply:function(req,res){
        let response = {
            sent:false,
            message:'',
            success:false,
        };

        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));

            if(!received.id || !__validateId(received.id))
                throw Error(_errInfo[24]);
            if(!req.session.user)
                throw Error(_errInfo[35]);

            let deleteReply = function(){
                replyModel.findOneAndDelete({_id:received.id},function(err,doc){
                    if(err)
                        throw Error(err.message);
                    else if(!doc)
                        throw Error(_errInfo[36]);
                    else if(doc) {
                        htmlModel.deleteOne({link: received.id}, function (err, result) {
                            console.log(err);
                        });
                        threadModel.findOneAndUpdate({_id:received.thread},{$inc:{deleted:1}}, {new:true},function(err,result){
                            if(err)
                                console.log(err);
                        });
                        response.success = true;
                        response.result = JSON.parse(JSON.stringify(doc));
                        handler.finalSend(res,response);
                    }
                });
            };

            handler.validateAccess(req,res,
                received,
                deleteReply,
                parseInt('000100',2),
                response);

        }catch(err){
            response.message = err.message;
            response.success = false;
            handler.finalSend(res,response);
        }
    },

    hideContents:function(req,res){
        let response = {
            sent:false,
            message:'',
            success:false,
        };

        try{
            let received = JSON.parse(lzString.decompressFromBase64(req.body.data));
            if(!received.thread || !__validateId(received.thread))
                throw Error(_errInfo[33]);
            if(received.type === 1 && (!received._id || !__validateId(received._id)))
                throw Error(_errInfo[33]);
            if(!req.session.user)
                throw Error(_errInfo[35]);

            let sendResult = function(err,result){
                if(err){
                    response.message = err.message;
                    response.success = false;
                }else if(!result){
                    response.message=  _errInfo[33];
                    response.success = false;
                }else{
                    response.success = true;
                    response.status = result.status;
                }
                response._id = result._id;
                handler.finalSend(res,response);
            }

            let hideContents = function(){
                if(received.type){
                    replyModel.findOneAndUpdate({_id:received._id},{status:received.status},{new:true},function(err,result){
                        sendResult(err,result);
                    })
                }else{
                    threadModel.findOneAndUpdate({_id:received._id},{status:received.status},{new:true},function(err,result){
                        sendResult(err,result);
                    })
                }
            };

            threadModel.findOne({_id:received.thread},function(err,result){
                if(!err && result && result.author.toString() === req.session.user._id.toString())
                    hideContents();
                else{
                    handler.validateAccess(req,res,
                        received,
                        hideContents,
                        parseInt('000100',2),
                        response);
                }
            })
        }catch(err){
            response.message = err.message;
            response.success = false;
            handler.finalSend(res,response);
        }
    }
};

module.exports = handler;