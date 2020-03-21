var express = require('express'),
    path =require('path');

module.exports=function(app)
{
    //static assets
    app.use('/fonts',express.static(path.join(__basedir,'/public/fonts')));
    app.use('/css',express.static(path.join(__basedir,'/public/css')));
    app.use('/img',express.static(path.join(__basedir,'/public/image')));
    app.use('/video',express.static(path.join(__basedir,'/public/video')));
    app.use('/svg',express.static(path.join(__basedir,'/public/svg')));

    //angular modules;
    app.use('/templates',express.static(path.join(__basedir,'/public/html/templates')));
    app.use('/service',express.static(path.join(__basedir,'/public/html/service')));
    app.use('/controller',express.static(path.join(__basedir,'/View/controller')));
    app.use('/modules',express.static(path.join(__basedir,'/View/modules')));
    app.use('/js',express.static(path.join(__basedir,'/js/ext/')));
    app.use('/gameLib',express.static(path.join(__basedir,'/js/game/')));
};