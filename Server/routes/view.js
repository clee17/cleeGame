var express = require('express'),
    path = require('path');

let router = express.Router();

let routeHandler = {
    getFile:function(req,res){
        let fileName = req.params.fileName;
        let sub ='';
        let hostName = req.hostname;
        if(hostName.indexOf('www.')!= -1)
            hostName = hostName.slice(4);
        let index = hostName.indexOf('cleegame.com');
        if(index > 1)
        {
            sub = hostName.substring(0,index-1)+'/';
            sub = sub[0].toUpperCase()+sub.slice(1);
            sub = 'clee'+sub+'/';
        }
        else if(index == 0)
            sub = 'cleeGame/';
        else
            sub='cleeGame/';
        if(__entryFile.indexOf(fileName)!=-1)
            next();
        if(fileName.indexOf('.html')!= -1)
            res.render(path.join(sub,fileName));
        else
            res.sendFile(path.join(__basedir,'View/',sub,'/',fileName));
    },

    getSubFile:function(req,res){
        let fileName = req.params.fileName;
        let sub ='';
        let hostName = req.hostname;
        if(hostName.indexOf('www.')!= -1)
            hostName = hostName.slice(4);
        let index = hostName.indexOf('cleegame.com');
        if(index >1)
        {
            sub = hostName.substring(0,index-1)+'/';
            sub = sub[0].toUpperCase()+sub.slice(1);
            sub = 'clee'+sub+'/';
        }
        else if(index == 0)
            sub = 'cleeGame/';
        else
            sub='cleeGame/';
        let subFolder = req.params.subFolder;
        subFolder+='/';
        if(fileName.indexOf('.html')!= -1)
            res.render(path.join(sub,'/modules/',fileName));
        else
            res.sendFile(path.join(__basedir,'View/',sub,subFolder,fileName));
    }
};

router.get('/:fileName',routeHandler.getFile);
router.get('/:subFolder/:fileName',routeHandler.getSubFile);
module.exports = router;