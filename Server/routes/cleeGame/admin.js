let express = require('express'),
    path = require('path'),
    newsModel = require(path.join(__dataModel, 'cleeGame_news')),
    worksModel = require(path.join(__dataModel,'cleeGame_works')),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let gameInfoModel = require(path.join(__dataModel,'cleeGame_gameInfo'));

let handler = {
    finalSend:function(res,data)
    {
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    index:function(req,res,next){
        let viewPortMap = new Map();
        viewPortMap.set('/games/admin',{viewport:'admin/GameAdmin.html',controllers:['/view/cont/gameAdminController.js'],services:[]});
        let result = viewPortMap.get(req.url);
        if(!result)
            next();
        if(req.session.user && req.session.user.settings.accessLevel >=10)
           __renderIndex(req,res,result);
        else
            __renderError(req,res,_errAll[2]);
    },

    publish:function(req,res){
        if(__allowedIP && __allowedIP.indexOf(req.ip) !== -1) {
            res.sendFile(path.join(__view,'cleeGame/admin/publish.html'));
        }
        else
        {
            res.render(path.join(__view,'cleeGame/error.html'),{title:'没有权限',message:"您没有权限访问该页面"});
        }
    },

    publishWorks:function(req,res){
        if(__allowedIP && __allowedIP.indexOf(req.ip) !== -1) {
            res.sendFile(path.join(__view,'cleeGame/admin/publishWorks.html'));
        }
        else
        {
            res.render(path.join(__view,'cleeGame/error.html'),{title:'没有权限',message:"您没有权限访问该页面"});
        }
    },

    publishWork:function(req,res){
        if(__allowedIP &&__allowedIP.indexOf(req.ip)!== -1)
        {
            var metaData = JSON.parse(lzString.decompress(req.body.metaData));
            let instance =  new worksModel();
            if(instance == null)
            {
                res.send({result:false,message:'暂时没有此类别的文章可供发布！'});
                return;
            }
            instance.title=metaData.title;
            instance.type=metaData.type;
            instance.cover=metaData.cover;
            instance.subTitle = metaData.subTitle;
            instance.tag = metaData.tag;
            instance.statements = metaData.statements;
            instance.intro = metaData.intro;
            instance.gameLink = metaData.gameLink;
            instance.status = metaData.status;
            instance.save(function (err) {
                if (err)
                {
                    console.log(err);
                    res.send({result:false,message:"存储失败！"});
                }
                else{
                    res.send({result:true,message:"存储成功!"});
                }
            });

        }
        else{
            res.send({result:false,message:'您没有发布作品的权限！'});
        }
    },

    publishNews:function(req,res){
        if(__allowedIP &&__allowedIP.indexOf(req.ip)!== -1)
        {
            let instance =  new newsModel();
            if(instance == null)
            {
                res.send({result:false,message:'暂时没有此类别的文章可供发布！'});
                return;
            }
            instance.title = lzString.decompress(req.body.title);
            instance.contents = lzString.decompress(req.body.contents);
            instance.type=req.body.type;
            instance.subType=req.body.subType;
            instance.save(function (err) {
                if (err)
                {
                    res.send({result:false,message:"存储失败！"});
                }
                else{
                    res.send({result:true,message:"存储成功!"});
                }
            });

        }
        else{
            res.send({result:false,message:'您没有发布新闻的权限！'});
        }
    },

    add:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            success:false
        };

        let errorMessage = null;

        if(receivedData.title.length === 0)
            errorMessage = '游戏名称不能为空';
        else if(receivedData.path.length ===0)
            errorMessage = '游戏路径不能为空';
        else if(receivedData.path.indexOf('/') ===0)
            errorMessage = '游戏路径不能以/开头';
        else if(!receivedData.finalVersion.match(/^[1-9][0-9]*.[0-9]+.[0-9]+$/))
            errorMessage = '游戏版本号必须是数字';
        else if(!receivedData.exchangeRate || receivedData.exchangeRate.length ===0)
            errorMessage = '您必须输入积分兑换汇率';
        else if(!receivedData.exchangeRate.match(/^[1-9][0-9]*$/))
            errorMessage = "积分兑换汇率必须是数字";
        else if(receivedData.resolution.width ===0 || receivedData.resolution.height ===0 )
            errorMessage = '游戏视窗的宽高不能为0';
        else if(receivedData.description === "")
            errorMessage = '游戏版本说明不能为空';

        if(errorMessage !== null)
        {
            result.message = errorMessage;
            handler.finalSend(res,result);
            return;
        }

        delete receivedData.resolution.refer;

        gameInfoModel.findOneAndUpdate(
            {version:receivedData.finalVersion,title:receivedData.title},
            {path:receivedData.path,type:receivedData.gameType.type,resolution:receivedData.resolution,exchangeRate:Number(receivedData.exchangeRate),update:Date.now(),description:receivedData.description,$set:{modules:receivedData.modules}},
            {new:true,upsert:true,setDefaultsOnInsert: true},
            function(err,doc){
                if(!err)
                {
                    result.doc = JSON.parse(JSON.stringify(doc));
                    result.success = true;
                    handler.finalSend(res,result);
                }
                else
                {
                    result.message = err;
                    handler.finalSend(res,result);
                }
            });
    },

    fullList:function(req,res){
        let receivedData = JSON.parse(lzString.decompressFromBase64(req.body.data));
        let result = {
            sent:false,
            message:'',
            success:false
        };

        if(!receivedData.pageId || receivedData.pageId<0)
            result.message = '无效的页码'+receivedData.pageId;
        if(!receivedData.perPage || receivedData.perPage <0)
            result.message = '无效的单页作品数';
        if(result.message !== '')
            handler.finalSend(res,result);

        receivedData.pageId --;

        let searchCriteria = null;
        if(req.session.user && req.session.user.settings.accessLevel>= 99)
            searchCriteria = {};
        else if (req.session.user)
            searchCriteria = {user:req.session.user._id};
        if(!searchCriteria)
        {
            result.docs = [];
            result.success = false;
            result.message = '您的登录状态已过期，请重新登录';
            handler.finalSend(res,result);
            return;
        }
        gameInfoModel.find({},function(err,docs){
            if(err)
                result.message = JSON.stringify(err);
            else if(docs.length < receivedData.pageId * receivedData.perPage)
                result.message = '无效页码'+receivedData.pageId;
            else
            {
                let perPage = receivedData.perPage;
                let pageId =receivedData.pageId;
                result.success = true;
                result.docs = JSON.parse(JSON.stringify(docs.slice(perPage*pageId,perPage*pageId+perPage)));
                handler.finalSend(res,result);
                return;
            }
            handler.finalSend(res,result);
        });
    },
};

module.exports = handler;