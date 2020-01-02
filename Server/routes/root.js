var express = require('express'),
    path = require('path');


var handler = {
    getFile:function(req,res)
    {
        let fileId = req.params.fileId;
        if(fileId == 'cache.manifest')
        {
            res.sendFile(path.join(__basedir,'cache.manifest'));
        }
    }

};

module.exports=handler;