let express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    lzString = require(path.join(__basedir, 'js/lib/angular-lz-string'));

let indexModel = require(path.join(__dataModel,'cleeArchive_workIndex')),
    chapterModel =require(path.join(__dataModel,'cleeArchive_fanfic'));

let handler = {
    index:function(req,res,next){
        let viewPortMap = new Map();
        viewPortMap.set('/',{viewport:'/dynamic/entry',controllers:['/view/cont/index_con.js'],services:['/view/cont/feedService.js']});
        viewPortMap.set('/fanfic',{viewport:'/view/fanficMain.html',controllers:['/view/cont/index_con.js']});
        viewPortMap.set('/tech',{viewport:'/view/tech.html',controllers:['/view/cont/index_con.js']});
        viewPortMap.set('/design',{viewport:'/view/design.html',controllers:['/view/cont/index_con.js']});
        viewPortMap.set('/admin',{viewport:'/view/admin.html',controllers:['/view/cont/admin_con.js']});
        viewPortMap.set('/register',{viewport:'/view/register.html',controllers:['/templates/login.js','/templates/log_con.js'],services:[],variables:{loginMode:0}});
        let result = viewPortMap.get(req.url);
        if(!result)
            next();
        else if(req.url == '/' )
        {
            if(req.session.user)
                __renderIndex(req,res,result);
            else
                __renderIndex(req,res,viewPortMap.get('/register'));
        }
        else if(req.url == '/admin')
        {
            if(req.session.user && req.session.user.group[0] >= 99)
                __renderIndex(req,res,result);
            else
                __renderError(req,res,'您没有权限访问该界面，仅管理员可以登录。');
        }
        else
            __renderIndex(req,res,result);
    },
    
    fanfic:function(req,res,next){
        let fileName = req.params.fanficId;
        let index = ['new','preview','validate'];
        if(index.indexOf(fileName) ==-1)
        {
            if(fileName && fileName.indexOf('.html')!= -1)
                res.sendFile(path.join(__basedir,'public/html/',fileName));
            else
                handler.fanficDetail(req,res,next,fileName);
        }
        else
            next();
    },

    fanficDetail:function(req,res,next,fileName){
        let readerId = req.session.user? req.session.user._id :  null;
        let data = {book:null,chapter:null,index:null,codeMatch:false,readerId:readerId};
        let noRes = null;
        let sent = false;

        let finalSend = function(){
            if(sent)
                return;
            sent = true;
            if(data.index &&  data.index.length && data.book)
            {
                if(data.index.length == 1 && data.book.status == 0)
                    data.title = data.book.title;
                else
                {
                    data.title = __chapterCount(data.currentIndex.order)+'    ' +data.chapter.title;
                }
            }

            if(noRes)
                __renderError(req,res,noRes.message);
            else if(data.chapter && data.chapter.lockType == 1 && !req.session.user)
                __renderError(req,res,'该作者为文章设置了站内可见，您必须成为注册用户才能阅览该文章');
            else if(data.chapter && data.chapter.lockType == 2)
                __renderError(req,res,'该作者设置该文章为仅自己可见，您无法阅读该文章。');
            else if(!data.grade)
                __renderError(req,res,'后台网站设置出错，请联系管理员');
            else if(data.chapter && data.chapter.lockType <2)
                res.render('cleeArchive/fanfic.html',data);
        };

        if(!fileName.match(/^[0-9a-fA-F]{24}$/)){
            __renderError(req,res,'您输入的不是正确的文章目录网址，无法搜索');
            sent = true;
            return;
        }

        indexModel.findOne({chapter:fileName}).populate([{path:'work'},{path:'prev next',select:'_id title published'},{path:'chapter',select:'passcode published'}]).exec()
            .then(function(doc){
                if(!doc)
                    throw '数据库中没有该章节';
                if(!doc.chapter || !doc.chapter.published)
                    throw '该章节还没有被发布，您无法阅览';
                data.book = JSON.parse(JSON.stringify(doc.work));
                data.currentIndex = JSON.parse(JSON.stringify(doc));
                if(doc.chapter && doc.chapter.passcode.use)
                {
                    let md5 = crypto.createHash('md5');
                    let passCode =  md5.update(doc.chapter.passcode.code).digest('hex').toString();
                    if(passCode == req.cookies[doc.chapter._id])
                        data.codeMatch = true;
                }
                return chapterModel.findOneAndUpdate({_id:doc.chapter},{$inc:{visited:1}},{new: true}).populate('user','_id user group');
            })
            .then(function(doc){
                data.chapter= JSON.parse(JSON.stringify(doc));
                data.user = JSON.parse(JSON.stringify(doc.user));
                return indexModel.find({work:data.book._id},null,{sort:{order: 1}}).populate('chapter','_id type title published').exec();
            })
            .then(function(docs){
                if(!docs|| docs.length ==0)
                    throw '没有这本作品的目录';
                data.index =  JSON.parse(JSON.stringify(docs));
                redisClient.get('fafic_grade',function(err,response){
                    if(!err && !response)
                    {
                        data.fanfic_grade =  JSON.parse(response);
                        finalSend();
                    }
                    else
                       __readSettings(finalSend,data);
                });
            })
            .catch(function(err){
                console.log(err);
                noRes = {message:err};
                finalSend();
            });
    },

    validate:function(req,res,next){
        let sent = false;
        let request = JSON.parse(req.body.request) || null;
        let type = request.type || '-1';
        let index = req.params.fanficId;

        let response = {status:0,code:null};

        let finalSend = function(){
            if(sent)
                return;
            res.send(JSON.stringify(response));
            sent = true;
        };

        if(!request)
            finalSend();
        else
        {
            chapterModel.findOne({_id:index}).exec()
                .then(function(doc){
                    if(!doc)
                        throw '数据库中没有这本书';
                    let md5 = crypto.createHash('md5');
                    let passCode =  md5.update(doc.passcode.code).digest('hex').toString();
                    if(request.code == passCode) {
                        response.code = passCode;
                        response.status = 1;
                    }
                    finalSend();
                })
                .catch(function(err){
                    response.status = 0;
                    response.msg = err;
                    finalSend();
                });
        }
    },

    tech:function(req,res){
        
    }
};

module.exports = handler;