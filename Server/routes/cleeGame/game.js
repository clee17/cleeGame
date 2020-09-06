let path = require('path'),
    fs = require('fs'),
    gameList = require(path.join(__dataFormat,'/gamesList.js')),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let gameInfoModel = require(path.join(__dataModel,'cleeGame_gameInfo')),
    gameModuleModel = require(path.join(__dataModel,'cleeGame_gameModules'));

　
let handler = {
    finalSend:function(res,data)
    {
          if(data.sent)
              return;
          data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    finalStr:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
       res.status(data.status).send(lzString.compressToBase64(data.contents));
    },

    finalRender:function(res,data){
        if(data.rendered)
            return;
        data.rendered = true;
        res.render('cleeGame/game/index2.html',data);
    },

    renderError:function(res,data,message,title){
        if(data.rendered)
            return;
        data.rendered = true;
        if(title)
            data.title = title;
        data.message = message;
        res.render('cleeGame/error.html',data);
    },

    getGame:function(req,res){
        console.log('entered');
        let data = {rendered:false};
        let gameName = req.params.gameId;
        if(!gameName)
            handler.renderError(res,data,"请输入正确的游戏路径名称",'游戏未找到');
        gameInfoModel.findOne({path:gameName},function(err,doc){
            if(!err && doc)
            {
                let render = data.rendered;
                data = JSON.parse(JSON.stringify(doc));
                data.rendered = render;
                if(doc)
                    handler.getModules(req,res,data);
                else
                    handler.renderError(res,data,"我们的数据库中没有找到这款游戏",'游戏未找到');
            }
            else
                handler.renderError(res,data,"我们的数据库中没有找到这款游戏",'游戏未找到');
        });
    },

    getModules:function(req,res,data){
        let files = ['lzString','boot','JSZip'];
        files = files.concat(data.modules);
        let countryCode = __getCountryCode(req.ipData);
        gameModuleModel.aggregate([
                {$match:{name:{$in:files}}},
                {$facet:{
                    "dependencies":[
                        {$match:{}},
                        {$unwind:"$dependencies"},
                        {$lookup:{from:"game_modules",localField:"dependencies",foreignField:"name",as:"depend"}},
                        {$unwind:"$depend"},
                        {$replaceRoot:{newRoot:"$depend"}},
                    ],
                    "basics":[
                        {$match:{}}
                    ]
                }},
                {$project:{all:{$setUnion:["$dependencies","$basics"]}}},
                {$unwind:"$all"},
                {$replaceRoot:{newRoot:"$all"}}
            ],function(err,docs){
            if(err)
            {
                handler.renderError(res,data,err);
                return;
            }
            data.lib = [];
            let tmpModules = JSON.parse(JSON.stringify(data.modules));
            data.modules = [];
            docs.forEach(function(item){
                let tmp = JSON.parse(JSON.stringify(item));
                tmp.path = tmp.path[countryCode];
                if(tmpModules.indexOf(tmp.name)>0)
                    data.modules.push(tmp);
                else
                    data.lib.push(tmp);
            });
            handler.newGame(req,res,data);
        })
    },

    newGame:function(req,res,data)
    {
        let resourceList = [{path:'/css/root.css',name:'style_root',type:'css'},
            {path:'/Scene/load.js',name:'scene_load',type:'js'}];
        let loadCount = 0;
        resourceList.forEach(function(item,i,arr){
            fs.readFile(path.join(__basedir, 'Directory/'+data._id+item.path), {encoding: 'utf-8'},(err,file)=> {
                if(err)
                    handler.renderError(res,data,"游戏尚在开发中，敬请期待",'游戏开发中');
                else
                    data[item.name] = file;
                if(item.type === 'css')
                    data[item.name] = '<style>'+data[item.name]+'</style>';
                else if(item.type === 'js')
                    data[item.name] = '<script>'+data[item.name]+'</script>';
                loadCount++;
                if(loadCount === resourceList.length)
                    handler.finalRender(res,data);
            });
        });
    },

    getResource:function(req,res){
        let id = req.query.id;
        if(!id)
            res.status(404).send({message:'请输入正确的游戏路径名'});
        let filePath = path.join(__game,id+'/'+id+'.zip');
        fs.readFile(filePath,function(err,data){
            res.status(200).send(data);
        });
    },

    loadDir:function(data,path,res) {
        fs.readdir(data.subPath+path,function(err,docs){
            data.loadList.splice(data.loadList.indexOf(path),1);
            if(docs && docs.length>0){
                if(docs && docs.length >0)
                {
                    for(let i =0; i< docs.length; ++i)
                    {
                        let doc = docs[i];
                        if(path === 'Scene' && data.loadedScene.indexOf(docs[i]) !== -1)
                            continue;
                        if(doc.slice(doc.lastIndexOf('.'))=== '.js')
                            data.contents += fs.readFileSync(data.subPath+'/'+path+'/'+docs[i],{encoding:'utf-8'});
                    }
                }
            }
            if(data.loadList.length === 0)
            {
                data.status = 200;
                handler.finalStr(res,data);
            }
        })
    },

    loadText:function(req,res){
        let id = req.params.gameId;
        let result = fs.readFileSync(path.join(__game,id+'/','text.json'),{encoding:'utf-8'});
        if(!result)
           res.status(404).send({message:'There is no text under the game file'});
        else
            res.status(200).send(lzString.compressToBase64(result));
    },

    loadScripts:function(req,res){
        let id = req.query.id;
        let list = req.query.load || [];
        if(typeof list === 'string')
            list = lzString.decompressFromBase64(list);
        if(!id)
            res.status(404).send({message:'请输入正确的游戏路径名'});
        let finalSend = {
            contents: '',
            loadList:['Scene','Display','Manager'],
            id:id,
            loadedScene:list,
            subPath:path.join(__game,id+'/'),
            sent:false,
            status:404,
        };
        let widget = fs.readFileSync(path.join(__game,id+'/','widget.json'),{encoding:'utf-8'});
        widget = JSON.parse(widget);
        for(let i=0;i <widget.length;++i){
            let filename = widget[i].type+'_'+widget[i].name+'.js';
            finalSend.contents+= fs.readFileSync(path.join(__basedir,'/js/game/',filename),{encoding:'utf-8'});
        }
        handler.loadDir(finalSend,'Scene',res);
        handler.loadDir(finalSend,'Display',res);
        handler.loadDir(finalSend,'Manager',res);
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
};

module.exports = handler;