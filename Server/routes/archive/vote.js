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
                detail.title = encodeURIComponent(__multiLang(vote.title,req.ipData));
                detail.description = encodeURIComponent(__multiLang(vote.description,req.ipData));
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
                return;
            }
            let voted = false;
            if(req.session.user&& req.session.user.userGroup >= 999){
                voted  = false;
                if(req.cookies[voteId])
                    voted = true;
                __renderSubPage(req,res,'vote', {start:start,end:end,options:options,voted:voted});
            }
            else if(req.cookies[voteId]){
                voted = true;
                __renderSubPage(req,res,'vote', {start:start,end:end,options:options,voted:voted});
            }else
                resultModel.findOne({vote:voteId,ip:req.ip},function(err,result){
                    if(result)
                        voted = true;
                    __renderSubPage(req,res,'vote', {start:start,end:end,options:options,voted:voted});
                });

        })
    },

    save:function(req,res){
        let received  =   JSON.parse(lzString.decompressFromBase64(req.body.data));

        let list = [];
        for(let i =0; i<received.result.length;++i){
            list.push(received.result[i]._id);
        };


        let response = {
            message:'',
            success:false,
            sent:false
        };

        if(!received._id || !__validateId(received._id)){
            response.message = ' no validate vote id received';
            handler.finalSend(response);
        }

        optionModel.updateMany({vote:received._id,_id:{$in:list}},{$inc : {count: 1} },function(err,result){
            if(err){
                response.message = err.message;
                handler.finalSend(res,response);
            }else{
                response.success = true;
                handler.finalSend(res,response);
                let bulk = [];
                for(let i=0; i<received.result.length;++i){
                    let country = req.ipData.country;
                    let ipAddress = req.ip;
                    let insert =  {updateOne: {
                        filter: {"ip": ipAddress, voteOption:received.result[i]._id,"createdAt":Date.now()},
                        update: {"$setOnInsert": {
                                "ip": ipAddress,
                                 "voteOption": received.result[i]._id,
                                 "vote" : received._id,
                                 "countryCode": country,
                                 "comment": received.result[i].comment || "",
                                 "description": received.result[i].description || ""}
                        },
                        upsert: true
                    }};
                    bulk.push(insert);
                }
                if(bulk.length>0)
                    resultModel.bulkWrite(bulk,function(err,result){
                        if(err)
                            console.log(err);
                        else
                            console.log(result);
                    });
            }
        })
    }
};

module.exports = handler;