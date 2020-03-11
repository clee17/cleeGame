var express = require('express'),
    path = require('path');

let main = require(path.join(__routes,"/cleeGame/main")),
    admin = require(path.join(__routes,"/cleeGame/admin")),
    info = require(path.join(__routes,"/cleeGame/info")),
    game = require(path.join(__routes,"/cleeGame/game")),
    works = require(path.join(__routes,"/cleeGame/works"))

    userSettingModel = require(path.join(__dataModel,'cleeGame_userSetting.js'));

let router = express.Router();

global.__renderIndex = function(req,res,renderInfo){
    let renderPage = {controllers:[],modules:[],services:[],err:'',user:req.session.user,userId:'',title:null,styles:[],variables:{}};
    if(req.ipData && req.ipData.country === '中国')
        renderPage.lib = [
            'https://cdn.bootcss.com/lz-string/1.4.4/lz-string.min.js',
            'https://cdn.bootcss.com/angular.js/1.7.8/angular.min.js',
            'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
    else
        renderPage.lib = [
            'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js',
            'https://cdn.jsdelivr.net/npm/angular@1.7.9/angular.min.js',
            'https://cdn.jsdelivr.net/npm/angular-cookies@1.5.9/angular-cookies.min.js'];
    for(let attr in renderInfo){
        renderPage[attr] = renderInfo[attr];
    }
    if(req.session.user)
        renderPage.userId = req.session.user._id;
    else
        renderPage.userId = req.ip;
    if(renderInfo.viewport)
         res.render('cleeGame/'+renderInfo.viewport,renderPage);
    else
        res.render('cleeGame/index.html',renderPage);
};

global.__renderError = function(req,res,errMessage){
    let userId = req.ip;
    if(req.session.user)
        userId = req.session.user._id;
    let renderInfo = {user:req.session.user,userId:userId,title:null,styles:[],variables:{}};
    renderInfo.lib = [];
    renderInfo.message = errMessage;
    res.render('cleeGame/error.html',renderInfo);
};

//主界面
router.get('/',main.index);
router.get('/news',main.index);
router.get('/downloads/',main.index);
router.get('/manual',main.index);
router.get('/contact',main.index);

//新闻与单页信息
router.post('/getNewsList',main.getNewsList);
router.get('/news/:newsId',main.getNewsPage);
router.post('/news/prev',main.getPrevInInfo);
router.post('/news/next',main.getNextInInfo);

router.post('/getManual',main.getManual);
router.get('/info/:infoId',info.getInfo);

//游戏界面
router.get('/games/admin',admin.index);
router.get('/games/edit/:gameId',admin.edit);
router.post('/games/admin/addGame',admin.add);
router.post('/games/admin/gameList',admin.fullList);

router.get('/games/request',game.getResource);
router.get('/games/load',game.loadScripts);
router.get('/games/:gameId/',game.getGame);
router.get('/games/:gameId/',game.getGame);
router.post('/games/:gameId/requestPreview',game.getPreview);


//显示与阅读小说
router.post('/getWorksList',works.getWorksList);
router.post('/works/toChapter/',works.turnToChap);
router.post('/works/likeIt/',works.likeIt);
router.post('/works/cancelLike/',works.cancelLike);
router.get('/works/:worksId/',works.getWorkPage);

//发布与后台管理工具；
router.get('/publish',admin.publish);
router.post('/publishNews/',admin.publishNews);
router.get('/publishWorks',admin.publishWorks);
router.post('/publishWorks/publish',admin.publishWork);

router.get('/works/edit/:worksId',works.editWork);
router.post('/works/edit/update/',works.updateWork);
router.post('/works/edit/addVolume/',works.addVolume);
router.post('/works/edit/addChapter/',works.addChapter);



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

    app.use('/info',express.static(path.join(__basedir,'/public/html/basic')));

    app.use('/',router);

    app.get('*', function(req, res){
        res.render('cleeGame/error.html', {
            title: '出错啦!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};


