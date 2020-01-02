var express = require('express'),
    path = require('path');

let main = require(path.join(__routes,"/cleeGame/main")),
    admin = require(path.join(__routes,"/cleeGame/admin")),
    info = require(path.join(__routes,"/cleeGame/info")),
    game = require(path.join(__routes,"/cleeGame/game")),
    works = require(path.join(__routes,"/cleeGame/works")),
    root = require(path.join(__routes,"root"));

let router = express.Router();

//主界面
router.get('/',main.index);
router.get('/news',main.index);
router.get('/downloads/',main.index);
router.get('/manual',main.index);
router.get('/contact',main.index);
router.get('/:fileId',root.getFile);

//新闻与单页信息
router.post('/getNewsList',main.getNewsList);
router.get('/news/:newsId',main.getNewsPage);
router.post('/news/prev',main.getPrevInInfo);
router.post('/news/next',main.getNextInInfo);

router.post('/getManual',main.getManual);
router.get('/info/:infoId',info.getInfo);

//游戏界面
router.get('/games/dev/:gameId/',game.getDevIndex);
router.get('/games/:gameId/',game.getIndex);
router.get('/games/:gameId/img/title',game.getTitle);
router.get('/games/:gameId/img/title/request',game.getTitleResource);
router.get('/games/:gameId/img/:imgType/:imgId',game.getTypeImg);
router.get('/games/:gameId/img/:imgId',game.getImg);
router.get('/games/:gameId/css/:styleName',game.getCss);
router.get('/games/:gameId/js/:jsId',game.getJs);
router.get('/games/:gameId/data/:dataId',game.getJson);
router.get('/games/:gameId/audio/:audioType/:audioName',game.getAudio);
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

    app.use('/info',express.static(path.join(__basedir,'/public/html/basic')));

    app.use('/',router);

    app.get('*', function(req, res){
        res.render('cleeGame/generic/error404.html', {
            title: '出错啦!'
        })
    });
};


