var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    UtilFs = require(path.join(__utils,'/FileUtil'));


var router = express.Router();

var handler = {
    getFile:function(req,res){
        let fileName = req.params.fileName;

        let dir1 = path.join(__basedir,'/js/lib');
        let dir2 = path.join(__basedir,'/node_modules');
        let dir3 = path.join(__basedir,'/js/Utility');
        let dirArray = [dir1,dir2,dir3];
        let index = fileName[0].toLowerCase();
        let resultDir = [];
        for(var i=0; i< dirArray.length;++i)
        {
            if(resultDir.length != 0)
                break;
            resultDir = UtilFs.checkFileUnderDir(dirArray[i],fileName);
        }
        if(resultDir.length>0)
        {
            res.sendFile(resultDir[0]);
        }
        else{
            res.end();
        }
    }
};

router.get('/:fileName',handler.getFile);

module.exports=router;