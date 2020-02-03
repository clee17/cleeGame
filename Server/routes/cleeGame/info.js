let express = require('express'),
    path = require('path'),
    newsModel = require(path.join(__dataModel, 'cleeGame_news')),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let handler = {

    getInfo:function(req,res){
        let infoId = req.params.infoId;
        newsModel.findOneAndUpdate({_id:infoId},{$inc:{visited:1}},function(err,data){
            if(err) {
                res.render('cleeGame/generic/error404.html',{title:'出错啦'});
            }
            else
            {
                res.render('cleeGame/info',data);
            }
        });
    }
};

module.exports = handler;