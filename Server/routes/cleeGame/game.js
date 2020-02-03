let express = require('express'),
    path = require('path'),
    fs = require('fs'),
    gameList = require(path.join(__dataFormat,'/gamesList.js')),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));
　
let handler = {
    getIndex:function(req,res){
        let gameName = req.params.gameId;
        if(gameList[gameName])
        {
            let entry = gameList[gameName];
            let data ={
                title: entry.name,
                path: '/games'+entry.path,
                srcList:entry.src.join(',')
            };
            res.render('cleeGame/gameEntry/index.html',data);　
        }
        else
            res.render('cleeGame/generic/error404.html',{title:'游戏未找到'});
    },

    getDevIndex:function(req,res){
        let gameName = req.params.gameId;
        if(gameList[gameName])
        {
            let entry = gameList[gameName];
            let data ={
                title: entry.name,
                path: '/games'+entry.path,
                srcList:entry.src.join(',')
            };
            if(__allowedIP.indexOf(req.ip)!= -1)
               res.render('cleeGame/gameEntry/index_dev.html',data);
            else
                res.status(503).send('你没有权限访问该页面');
        }
        else
            res.render('cleeGame/generic/error404.html',{title:'游戏未找到'});
    },

    getImg:function(req,res){
        console.log('getImg entered');
        let gameName = req.params.gameId;
        let imgName = req.params.imgId;
        console.log(imgName);
        let suffix = ['.png','.jpg'];
        let filePath = '';
        if(gameList[gameName])
             filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/img/'+imgName);
        console.log(filePath);
        fs.access(filePath,function(err){
            if(err)
            {
                console.log(err);
                res.status(404).send("Sorry can't find that!");
            }
            else
                res.sendFile(filePath);
        })
    },

    getTitleImg:function(req,res)
    {
        let gameName = req.params.gameId;
        let imgName = req.params.imgId;
        let filePath = '';
        if(gameList[gameName])
            filePath = 'Directory'+gameList[gameName].path+'/img/titles/'+imgName;
    },

    compressTitle:function(req,res)
    {
        let gameName = req.params.gameId;
        let imgName = req.params.imgId;
        let filePath = '';
        if(gameList[gameName])
            filePath = 'Directory'+gameList[gameName].path+'/img/titles/';
    },

    getTypeImg:function(req,res)
    {
        console.log('get type image entered');
        let gameName = req.params.gameId;
        let imgType = req.params.imgType;
        let imgName = req.params.imgId;
        let filePath = '';
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/img/'+imgType+'/'+imgName);
        console.log(filePath);
        fs.access(filePath,function(err){
            if(err)
            {
                console.log(err);
                res.status(404).send("Sorry can't find that!");
            }
            else
            {
                res.sendFile(filePath);
            }
        })
    },

    getCss:function(req,res)
    {
        console.log('getCss entered');
        let gameName = req.params.gameId;
        let styleName = req.params.styleName;
        let filePath = '';
        if(gameList[gameName])
             filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/css/'+styleName);
        fs.access(filePath,function(err){
            if(err)
                res.status(404).send("Sorry can't find that!");
            else
                res.sendFile(filePath);
        })
    },

    getJs:function(req,res)
    {
        let gameName = req.params.gameId;
        let jsName = req.params.jsId;
        let filePath = '';
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/js/'+jsName);
        fs.access(filePath,function(err){
            if(err)
                res.status(404).send("Sorry can't find that!");
            else
                res.sendFile(filePath);
        })
    },

    getJson:function(req,res)
    {
        let gameName = req.params.gameId;
        let dataId = req.params.dataId;
        let filePath = '';
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/data/'+dataId.toLowerCase());
        fs.readFile(filePath,'utf-8',function(err,data){
            if(err)
                res.status(404).send("Sorry can't find that!");
            else
            {
                let newData = JSON.parse(data);
                res.status(200).send(lzString.compressToBase64(JSON.stringify(newData)));
            }
        })
    },


    getAudio:function(req,res)
    {
        let gameName = req.params.gameId;
        let audioType = req.params.audioType;
        let audioName = req.params.audioName;
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/audio/'+audioType+'/'+audioName.toLowerCase());
        fs.readFile(filePath,function(err,data){
            if(err)
            {
                res.status(404).send("Sorry can't find that!");
            }
            else
            {
                res.status(200).send(data);
            }
        })
    },

    getPreview: function(req,res){
        let gameName = req.params.gameId;
        if(gameList[gameName])
        {
            res.status(200).send(lzString.compressToBase64(JSON.stringify({status:500,preLoadSrc:gameList[gameName].src.join(',')})));
        }
        else{
            res.status(404).send({status:503,message:'the game pathname is not correct'});
        }
    },

    getTitle: function(req,res){
        let id = req.query.id;
        if(!id || id>=3 || id<0)
            res.status(503).send('you need to pass an index');
        else
            id=parseInt(id);
        let gameName=req.params.gameId;
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/img/clgTitles/index.clg');
        if(gameList[gameName])
        {
            fs.readFile(filePath,function(err,data){
                if(err)
                    res.status(404).send("Sorry can't find that!");
                else
                {
                    let firstIndex = parseInt(data.length/3);
                    let secondIndex = firstIndex*2;
                    let indexList = [0,firstIndex,secondIndex,data.length];
                    let buffer = data.slice(indexList[id],indexList[id+1]);
                    res.status(200).send(buffer);
                }
            });
        }
    },

    getTitleResource:function(req,res)
    {
        let id = req.query.id;
        if(!id || id<0)
            res.status(503).send('you need to pass an valid index');
        else
            id=parseInt(id);
        let gameName=req.params.gameId;
        if(gameList[gameName])
            filePath = path.join(__basedir,'Directory'+gameList[gameName].path+'/img/clgTitles/Encrypt'+id+'.clg');
        if(gameList[gameName])
        {
            fs.readFile(filePath,function(err,data){
                if(err)
                    res.status(404).send("Sorry can't find that!");
                else
                {
                    res.status(200).send(data);
                }
            });
        }
    }
};

module.exports = handler;