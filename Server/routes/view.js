var express = require('express'),
    path = require('path');

let router = express.Router();

let routeHandler = {
    getFile:function(req,res){
        let fileName = req.params.fileName;
        if(__entryFile.indexOf(fileName)!=-1)
            next();
        if(fileName.indexOf('.html')!= -1)
            res.render(path.join(__viewFolder,fileName),{err:""});
        else
            res.sendFile(path.join(__basedir,'View/',__viewFolder,'/',fileName));
    },

    getSubFile:function(req,res){
        let fileName = req.params.fileName;
        let subFolder = req.params.subFolder;
        subFolder+='/';
        if(fileName.indexOf('.html')!= -1)
            res.render(path.join(__viewFolder,'/modules/',fileName));
        else
            res.sendFile(path.join(__basedir,'View/',__viewFolder,subFolder,fileName));
    }
};

router.get('/:fileName',routeHandler.getFile);
router.get('/:subFolder/:fileName',routeHandler.getSubFile);
module.exports = router;