const express = require('express'),
    path = require('path');

let fs = require('fs');

global.__msgList = new Array();

global.__chapterCount = function(index){
    if(index==0)
        return '首章';
    else if(index>0)
        return '第'+index+'章';
    else
        return '无法转义';
};

global.__renderIndex = function(req,res,renderInfo){
    let renderPage = {viewport:'',controllers:[],modules:[],
        services:[],err:'',user:req.session.user,userId:'',title:null,styles:[],variables:{},
        websiteInfo:_websiteInfo,
        infoAll:_infoAll,
        countryCode:__getCountryCode(req.ipData)};
    renderPage.lib = [
        'https://cdn.jsdelivr.net/npm/blueimp-md5@2.12.0/js/md5.min.js',
        'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js',
        'https://cdn.jsdelivr.net/npm/angular@1.7.9/angular.min.js',
        'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
    for(let attr in renderInfo){
        renderPage[attr] = renderInfo[attr];
    }
    renderPage.modules.push('/view/modules/errorBox.js');
    if(req.session.user)
        renderPage.userId = req.session.user._id;
    else
        renderPage.userId = req.ip;
    renderPage.variables.preference = req.session.user? req.session.user.settings.preference : 29;
    renderPage.variables.countryCode = __getCountryCode(req.ipData);
    res.render('cleeArchive/index.html',renderPage);
};

global.__renderSubPage = function(req,res,pageId,renderInfo){
    let renderPage = {};
    for(let attr in renderInfo){
        renderPage[attr] = renderInfo[attr];
    }
    renderPage.websiteInfo = _websiteInfo;
    renderPage.infoAll = _infoAll;
    res.render('cleeArchive/'+pageId+'.html',renderPage);
};

global.__renderTemplates = function(req,res,pageId,renderInfo){
    let renderPage = {};
    for(let attr in renderInfo){
        renderPage[attr] = renderInfo[attr];
    }
    res.render(path.join(__templates,pageId+'.html'),renderPage);
};

global.__renderError = function(req,res,errMessage){
    let userId = req.ip;
    if(req.session.user)
        userId = req.session.user._id;
    let renderInfo = {viewport:'/view/error.html',
        controllers:['/view/cont/err_con.js'],
        modules:[],
        services:[],
        err:errMessage,
        user:req.session.user,
        userId:userId,
        title:null,
        styles:[],
        variables:{},
        infoAll:_infoAll,
        countryCode:__getCountryCode(req.ipData),
        websiteInfo:_websiteInfo};
    renderInfo.lib = [
        'https://cdn.jsdelivr.net/npm/blueimp-md5@2.12.0/js/md5.min.js',
        'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js',
        'https://cdn.jsdelivr.net/npm/angular@1.7.9/angular.min.js',
        'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
    res.render('cleeArchive/index.html',renderInfo);
};

global.__readSettings = function (callBack,data) {
    let redisList = ['grade','warning'];
    let readResult = fs.readFile(path.join(__dataModel, '../json/fanficEdit.json'), {encoding: 'utf-8'},(err,File)=>{
        if(err)
        {
            data.err = err;
            if(callBack)
                callBack();
        } else{
            let settings = JSON.parse(File);
            let multiRedisCommands = [];
            while(redisList.length>0)
            {
                let keyString = redisList.pop();
                data['fanfic_'+keyString] = settings[keyString];
                multiRedisCommands.push(["set",keyString,JSON.stringify(settings[keyString])]);
            }
            if(callBack)
                callBack();
            redisClient.multi(multiRedisCommands).exec(function(err,docs){
            });
        }
    });
};

global.__validateId = function(id){
    if(!id)
        return false;
    if(id.match(/^[0-9a-fA-F]{24}$/))
        return true;
    else
        return false;
};

let  main = require(path.join(__routes,"/archive/main")),
     dynamic = require(path.join(__routes,'/archive/dynamic')),
     subUser = require(path.join(__routes,'/archive/user')),
     feed = require(path.join(__routes,"/archive/feed")),
     admin = require(path.join(__routes,"/archive/admin")),
     search = require(path.join(__routes,"/archive/search")),
     edit = require(path.join(__routes,"/archive/edit")),
     fanfic = require(path.join(__routes,"/archive/fanfic")),
     tag = require(path.join(__routes,"/archive/tag")),
     feedback = require(path.join(__routes,"/archive/feedback"));

let userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));


global.__updateCountMap = function(countList) {
    let updateList = [];
    countList.forEach(function (item) {
        if (item.increment !== 0)
            updateList.push({query: {infoType: item.infoType}, update: {$inc: {number: item.increment}}});
    });

    if (updateList.length > 0)
        updateList.forEach(function (item) {
            countMapModel.findOneAndUpdate(item.query,item.update,{new:true,upsert:true,setDefaultsOnInsert: true},function(err,doc){
            });
        });
};

global.__updateUserSetting = function(applicationId,data,req,callback){
    if(!__validateId(applicationId))
        return;
    if(!req.session.user)
        return;
    let userId = req.session.user._id;

    if(data.type == 1){
        req.session.user.settings.access.push(data.subType);
    }

    userSettingModel.findOneAndUpdate({user:userId},{$push:{access:data.subType}},function(err,doc){});
    if(callback)
        callback();
};

let router = express.Router();
//entry pages
router.get('/',main.index);
router.get('/fanfic',main.index);
router.get('/donate',main.index);
router.get('/registerProcess',main.index);
router.get('/visitorDonate',main.visitorDonate);
router.get('/tech/:techId',main.tech);
router.get('/countryStatement/:countryId',main.statement);

//tag pages

router.get('/tag',tag.searchTag);
router.get('/tag/tagPage',tag.tagPage);
router.post('/tag/:tagId',tag.requestTag);

//fanfic pages
router.get('/fanfic/:fanficId',main.fanfic);
router.post('/fanfic/validate/:fanficId',main.validate);
router.get('/fanfic/work/:workId',main.work);


//admin pages
router.get('/admin/',main.index);
router.post('/admin/getTable',admin.getTable);
router.post('/admin/addRecord',admin.addRec);
router.post('/admin/removeRec',admin.removeRec);
router.post('/admin/getRegister',admin.getRegister);
router.post('/admin/answerRegister',admin.answerRegister);
router.post('/admin/addApplication',admin.addApplication);

//user
router.get('/register/:registerId',subUser.register);
router.post('/users/follow',subUser.follow);
router.post('/users/followedTag',subUser.getTagFollowed);
router.post('/users/updateFollow',subUser.updateFollowed);
router.get('/users/:userId',subUser.userPage);
router.post('/users/settings/reload',subUser.reloadSettings);
router.get('/users/settings/:userId',subUser.userSetting);
router.post('/users/request/dashboard',subUser.requestDashboard);
router.post('/settings/save',subUser.saveSetting);
router.post('/settings/savePreference',subUser.savePreference);
router.post('/users/request/calculate',subUser.calculate);



//edit routes;
router.get('/fanfic/post/new',edit.newFanfic);
router.get('/fanfic/post/newTech',edit.newTech);
router.get('/fanfic/post/preview',edit.previewPage);
router.get('/fanfic/post/edit',edit.fanficEdit);
router.post('/fanfic/post/previewRequest',edit.fanficPreview);
router.post('/fanfic/post/publish',edit.publish);
router.post('/fanfic/change',edit.changeInfo);

router.post('/fanfic/chapter/save',edit.saveChapter);
router.post('/fanfic/chapter/add',edit.addChapter);
router.post('/fanfic/chapter/remove',edit.removeChapter);
router.post('/fanfic/chapter/swap',edit.swapChapter);
router.post('/fanfic/book/save',edit.saveBook);
router.post('/fanfic/post/loadChapter',edit.fanficGet);

router.post('/fanfic/post/delete',fanfic.deletePost);
router.post('/fanfic/post/deleteComment',fanfic.deleteComment);
router.post('/fanfic/post/like',fanfic.likePost);
router.post('/fanfic/post/bookmark',fanfic.bookmarkPost);
router.post('/fanfic/post/comment',fanfic.commentPost);

//feedback
router.post('/feedback/request',feedback.request);

//index
router.post('/search/all',search.all);
router.post('/search/count',search.count);

//feed
router.post('/feeds/channel',feed.channel);

//动态渲染网页
router.get('/dynamic/booknew',dynamic.bookNew);
router.get('/dynamic/bookedit',dynamic.bookedit);
router.get('/dynamic/entry',dynamic.entry);
router.get('/dynamic/users/setting/:userId',dynamic.userSetting);
router.get('/dynamic/users/:userId',dynamic.userPage);
router.get('/dynamic/*',function(req,res){
    res.render('cleeArchive/errorB.html',{error:_errAll[10]});
});

router.get('/statement/:fileId',function(req,res){
    let fileId = req.params.fileId;
    __renderSubPage(req,res,fileId,{statements:_statements,websiteInfo:_websiteInfo});
});

router.get('/templates/:fileId',function(req,res){
    let fileId = req.params.fileId;
    __renderTemplates(req,res,fileId,{statements:_statements,websiteInfo:_websiteInfo});
});

router.get('/modules/:filename',function(req,res){
    let fileId = req.params.filename;
    res.render('cleeArchive/modules/'+fileId+'.html',{statements:_statements,websiteInfo:_websiteInfo,user:req.session.user});
});


module.exports = function(app)
{
	 app.use('*',function(req,res,next){
        if(!req.session.user)
        {
            res.cookie('userId','',{maxAge:0});
        }
        if(req.session.user && !req.session.user.settings)
        {
            userSettingModel.findOneAndUpdate({user:req.session.user._id},{lastLogin:Date.now()},{new: true, upsert: true,setDefaultsOnInsert: true},function(err,doc){
                if(!err)
                    req.session.user.settings = JSON.parse(JSON.stringify(doc));
                next();
            });
        }
        else
            next();
    });

    app.use('/',router);

    app.use('*', function(req, res){
        __renderIndex(req,res,{
            viewport:'/view/error.html',
            controllers:['/view/cont/err_con.js'],
            err:_errAll[10]});
    });
};

