let express = require('express'),
    path = require('path');

let fs = require('fs');

global.__chapterCount = function(index){
    if(index==0)
        return '首章';
    else if(index>0)
        return '第'+index+'章';
    else
        return '无法转义';
};

global.__renderIndex = function(req,res,renderInfo){
    let renderPage = {viewport:'',controllers:[],services:[],err:'',user:req.session.user,title:null,styles:[],variables:{}};
    for(let attr in renderInfo){
        renderPage[attr] = renderInfo[attr];
    };
    res.render('cleeArchive/index.html',renderPage);
};

global.__renderError = function(req,res,errMessage){
      let renderInfo = {viewport:'/view/error.html',controllers:['/view/cont/err_con.js'],services:[],err:errMessage,user:req.session.user,title:null,styles:[],variables:{}};
      res.render('cleeArchive/index.html',renderInfo);
};

global.__readSettings = function (callBack,data) {
    let redisList = ['grade','warning'];
	console.log('readSettings entered');
    let readResult = fs.readFile(path.join(__dataModel, '../json/fanficEdit.json'), {encoding: 'utf-8'},(err,File)=>{
        if(err)
        {
            data.err = err;
        }
        else{
            let settings = JSON.parse(File);
            let redisCondition = [];
            let redisDocs = [];
            while(redisList.length>0)
            {
                let keyString = redisList.pop();
                data['fanfic_'+keyString] = settings[keyString];
                redisCondition.push('fanfic'+keyString);
                redisDocs.push(JSON.stringify(settings[keyString]));
                console.log(data);
            }
            asyncRedis.mset(redisCondition, redisDocs,function(err,docs){
				if(err)
					console.log(err);
            });
        }
        if(callBack)
             callBack();
    });
};

global.__validateId = function(id){
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
     edit = require(path.join(__routes,"/archive/edit"));

let userSettingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));

let router = express.Router();

//entry pages
router.get('/',main.index);
router.get('/fanfic/',main.index);
router.get('/tech/',main.index);
router.get('/design/',main.index);
router.get('/tech/:techId',main.tech);

//fanfic pages
router.get('/fanfic/:fanficId',main.fanfic);
router.post('/fanfic/validate/:fanficId',main.validate);

//admin pages
router.get('/admin/',main.index);
router.post('/admin/getTable',admin.getTable);
router.post('/admin/addRecord',admin.addRec);
router.post('/admin/removeRec',admin.removeRec);

//user
router.get('/register/:registerId',subUser.register);
router.get('/users/:userId',subUser.userPage);
router.post('/settings/save',subUser.saveSetting);
// router.post('/user/getInfo/',user.getInfo);

//edit routes;
router.get('/fanfic/post/new',edit.newFanfic);
router.get('/fanfic/post/preview',edit.previewPage);
router.get('/fanfic/post/edit',edit.fanficEdit);
router.post('/fanfic/post/previewRequest',edit.fanficPreview);
router.post('/fanfic/post/publish',edit.publish);


router.post('/fanfic/chapter/save',edit.saveChapter);
router.post('/fanfic/chapter/add',edit.addChapter);
router.post('/fanfic/book/save',edit.saveBook);
router.post('/fanfic/post/loadChapter',edit.fanficGet);


//feed
router.post('/feeds/channel',feed.channel);

//动态渲染网页
router.get('/dynamic/booknew',dynamic.bookNew);
router.get('/dynamic/bookedit',dynamic.bookedit);
router.get('/dynamic/entry',dynamic.entry);
router.get('/dynamic/users/:userId',dynamic.userPage);
router.get('/dynamic/*',function(req,res){
    res.render('cleeArchive/errorB.html',{error:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'});
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
            err:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'});
    });
};

