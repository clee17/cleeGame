let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'),
    tagModel = require(path.join(__dataModel,'cleeArchive_tag'))),
    msgModel = require(path.join(__dataModel,'cleeArchive_msgPool'));

let handler = {
    channel:function(req,res,next){
        let response = {
            code:403,
            message: ''
        };
        if(!req.session.user)
        {
            response.message='您需要先登录才能查看订阅';
            response.code = 408;
            res.send(lzString.compressToBase64(JSON.stringify(response)));
        }
        msgModel.find({publisher: req.session.user._id}).exec()
            .then(function (feeds) {
                response.code = 500;
                response.message = '搜索完成';
                response.data = feeds;
                res.send(lzString.compressToBase64(JSON.stringify(response)));
            })
            .catch(function (err) {
                console.log(err);
                response.message = err;
                res.cookie('userId',user._id.toString(),{maxAge:0});
                res.send(lzString.compressToBase64(JSON.stringify(response)));
            });
    }
};

module.exports = handler;