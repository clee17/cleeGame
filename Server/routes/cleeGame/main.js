let express = require('express'),
    path = require('path'),
    fs = require('fs'),
    newsModel = require(path.join(__dataModel, 'cleeGame_news')),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let handler = {
    index:function(req,res){
        let contents = fs.readFileSync(path.join(__view,'cleeGame/loginBoard.html'),{encoding:'utf-8'});
        let data = {loginBoard:contents};
        data.user = req.session.user || null;
        data.lib = [
            'https://cdn.jsdelivr.net/npm/blueimp-md5@2.12.0/js/md5.min.js',
            'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js',
            'https://cdn.jsdelivr.net/npm/angular@1.7.9/angular.min.js',
            'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
        res.render(path.join(__view,'cleeGame/index.html'),data);

    },

    getNewsList:function(req,res)
    {
        let pageId = req.body.pageIndex||1;
        pageId--;
        let perPage = req.body.newsPerPage || 15;
        let response = {
            status: 500,
            message: ''
        };
        newsModel.countDocuments({type:1005}).exec()
            .then(function(num){
                if(num==0)
                    throw '暂无新闻';
                else {
                    response.num = num;
                    return newsModel.find({type:1005},null,{skip:pageId*perPage,limit:perPage,sort:{_id: -1}}).exec();
                }
            })
            .then(function(doc){
                response.status = 500;
                response.contents = doc;
                res.send(lzString.compressToBase64(JSON.stringify(response)));
                return;
            })
            .catch(function(err){
                response.message = err.message;
                response.status = 503;
                res.send(lzString.compressToBase64(JSON.stringify(response)));
                return;
            });
    },

    getNewsPage:function(req,res)
    {
        let newsId = req.params.newsId;
        newsModel.findOneAndUpdate({_id:newsId},{$inc:{visited:1}},function(err,data){
            if(err) {
                res.end();
            }
            else
            {
                res.render('cleeGame/info',data);
            }
        });
    },

    getPrevInInfo:function(req,res)
    {
        let newsId = req.body.newsId;
        let type = req.body.type;
        newsModel.findOneAndUpdate({type:type,_id:{$lt:newsId}},{$inc:{visited:1}},{sort:{_id:-1}},function(err,data){
            if(err){
                res.send({msg:'后端出错啦'});
            }
            else
            {
                if(data && data._id)
                {
                    res.send({_id:data._id})
                }
                else{
                    res.send({msg:'no data found'});
                }
            }
        });

    },

    getNextInInfo:function(req,res) {
        let newsId = req.body.newsId;
        let type = req.body.type;
        newsModel.findOneAndUpdate({
            type: type,
            _id: {$gt: newsId}
        }, {$inc: {visited: 1}}, function (err, data) {
            if (err) {
                res.send({msg: '后端出错啦'});
            } else {
                if (data && data._id) {
                    res.send({_id: data._id})
                } else {
                    res.send({msg: 'no data found'});
                }
            }
        });
    },

    getManual:function(req,res)
    {
        let title = req.body.title || "";
        newsModel.find({ title: title, type: 1010},function(err,doc){
            if (err)
            {
                data={
                    contents:[]
                };
                res.send(data);
            }
            else{
                res.send({contents:doc});
            }
        });
    }
};

module.exports = handler;