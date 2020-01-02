var path = require('path'),
    bodyparser = require('body-parser'),
    cookie = require('cookie-parser'),
    session = require('express-session'),
    ejs = require('ejs'),
    redisStore = require('connect-redis')(session),

    statics = require('./statics'),
    lib = require('./routes/lib'),
    view = require('./routes/view'),
    user = require('./routes/user');

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

    app.use('/lib/',lib);

    app.use('/view/',view);

    app.use('/user/',user);

    statics(app);

    return app;
};