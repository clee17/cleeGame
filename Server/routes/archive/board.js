let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let boardModel = require(path.join(__dataModel,'board')),
    threadModel = require(path.join(__dataModel,'board_thread')),
    userGroupModel = require(path.join(__dataModel,'board_usergroup')),
    htmlModel = require(path.join(__dataModel,'cleeContents_board'));


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
                __renderSubPage(req,res,'board',detail);
            }
        });
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
            if(req.session.user && received.user !== req.session.user._id)
                throw Error(_errAll[23]);
            if(!received.board_id || !__validateId(received.board_id))
                throw Error(_errInfo[24]);
            info['board_id'] = received.board_id || "";
            if(info['board_id'] === "")
                info['board_id'] = null;
            info['title'] = received.title || "";
            info['title'] = decodeURIComponent(info['title']);

            info['contents'] = received.contents || "";
            info['contents'] = decodeURIComponent(info['contents']);

            info['author'] = received.user || null;
            if(info['author'] === '')
                info['author'] = null;

            info['grade'] = received.grade || 99;
         }catch(err){
            response.message = err.message;
            handler.finalSend(res,response);
            return;
        }

        let thread = new threadModel();
        thread.ip = info['ip'];
        thread.author = info['author'];
        thread.title = info['title'];
        thread.board = info['board_id'];
        thread.grade = info['grade'];
        console.log(thread);
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
                threadModel.findOneAndUpdate({_id:response.thread._id},{html:article._id},{new:true},function(err,result){
                });
                handler.finalSend(res,response);
            })
            .catch(function(err){
                response.success = false;
                response.message = err.message;
                handler.finalSend(res,response);
            })
    }
};

module.exports = handler;