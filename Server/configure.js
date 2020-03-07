var bodyparser = require('body-parser'),
    cookie = require('cookie-parser'),
    session = require('express-session'),
    ejs = require('ejs'),
    redisStore = require('connect-redis')(session),
    IP2Region = require('ip2region'),

    statics = require('./statics'),
    lib = require('./routes/lib'),
    view = require('./routes/view'),
    count = require('./routes/count'),
    user = require('./routes/user');

const ipSearcher = new IP2Region();

global.__errAll = require('./translation/err');
global.__infoAll = require('./translation/info');

module.exports=function(app){
    app.set('trust proxy',true);
    app.set('views',__view);
    app.engine('.html',ejs.__express);
    app.set('view engine','html');

    app.use(cookie());

    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({extended:true}));

    app.use(function(req,res,next){
        req.body.page = 0;
        next();
    });

    app.use(session({
        secret:'a;ejbgda',
        resave: false,
        store: new redisStore({ host:'127.0.0.1',port:'6379',db: 0, pass: '',client:redisClient}),
        cookie: {
            secure: false,
            path:'/',
            httpOnly:true,
            maxAge:null
        }
    }));

    app.use('*',function(req,res,next){
        let ip = req.ip;
        if(ip.match(/^(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5])$/))
            req.ipData = ipSearcher.search(ip);
        else{
            req.ipData = {};
            req.ipData.country = '中国';
        }

        if((req.ipData && req.ipData.country === '中国' && !req.cookies['readerLanguage']) || req.cookies['readerLanguage'] === '"CN"'){
            global._websiteInfo = __websiteInfo.cn;
            global._errInfo = __errInfo.cn;
            global._errAll = __errAll.cn;
            global._infoAll = __infoAll.cn;
            global._statements = global.__statements ? global.__statements.cn : null;
        }
        else{
            global._websiteInfo =  __websiteInfo.en;
            global._errInfo = __errInfo.en;
            global._errAll = __errAll.en;
            global._infoAll = __infoAll.en;
            global._statements = global.__statements ? global.__statements.en : null;
        }

        next();
    });

    app.use('/lib/',lib);

    app.use('/view/',view);

    app.use('/user/',user);

    app.use('/count/',count);

    statics(app);

    return app;
};