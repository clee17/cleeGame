let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let voteModel = require(path.join(__dataModel,'cleeArchive_vote')),
    optionModel = require(path.join(__dataModel,'cleeArchive_voteOption')),
    resultModel = require(path.join(__dataModel,'cleeArchive_voteResult'))
;

let handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    index:function(req,res){
        let voteId = req.params.voteId;

        if(!voteId || !__validateId(voteId)){
            __renderError(req,res,_errInfo[20]);
            return;
        }

        voteModel.findOne({_id:voteId},function(err,vote){
            if(err){
                __renderError(req,res,err.message);
            }else if(!vote){
                __renderError(req,res,_errInfo[20]);
            }else{
                let detail = JSON.parse(JSON.stringify(vote));
                detail.title = __multiLang(vote.title,req.ipData);
                detail.description = __multiLang(vote.description,req.ipData);
                let start = new Date(detail.start);
                let end = new Date(detail.end);
                let queryStr = 'A='+start.getTime()+'&B='+end.getTime();
                __renderIndex(req,res,{viewport:'/voteDetail/'+voteId+'?'+queryStr,
                    controllers:['/view/cont/vote_con.js'],
                    services:['/view/cont/voteService.js','/view/cont/filterWord.js'],
                    variables:detail});
            }

        });
    },

    sub:function(req,res){
        let voteId = req.params.voteId;
        let start = req.query.A;
        let end = req.query.B;
        if(!voteId || !__validateId(voteId)){
            __renderError(req,res, _errInfo[20]);
            return;
        }

        optionModel.find({vote:voteId},function(err,options){
            if(err){
                __renderError(req,res,err.message);
            }else{
                __renderSubPage(req,res,'vote', {start:start,end:end,options:options});
            }
        })
    }
};

module.exports = handler;