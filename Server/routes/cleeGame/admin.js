let express = require('express'),
    path = require('path'),
    newsModel = require(path.join(__dataModel, 'cleeGame_news')),
    worksModel = require(path.join(__dataModel,'cleeGame_works')),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let handler = {
    publish:function(req,res){
        if(__allowedIP && __allowedIP.indexOf(req.ip) !== -1) {
            res.sendFile(path.join(__view,'cleeGame/admin/publish.html'));
        }
        else
        {
            res.render(path.join(__view,'cleeGame/generic/forbidden505.html'),{title:'Forbidden'});
        }
    },

    publishWorks:function(req,res){
        if(__allowedIP && __allowedIP.indexOf(req.ip) !== -1) {
            res.sendFile(path.join(__view,'cleeGame/admin/publishWorks.html'));
        }
        else
        {
            res.render(path.join(__view,'cleeGame/generic/forbidden505.html'),{title:'Forbidden'});
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
    }
};

module.exports = handler;