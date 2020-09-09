global = require('../global');

var express= require('express'),
    config = require('../configure'),
    route = require('../routes/archive/index');

global.__websiteInfo = require('../translation/archive.js');
global.__errInfo = require('../translation/archive_err.js');
global.__statements = require('../translation/archive_statements.js');
global.__infoAll = require('../translation/info.js');

global.__viewFolder = '';


global.__identityInfo = {};

__identityInfo.fanfic_warning =[{
    "code": 100,
    "refer": 139
},{
    "code": 101,
    "refer": 140
},{
    "code": 102,
    "refer": 141
},{
    "code": 103,
    "refer": 142
}];

__identityInfo.fanfic_grade = [{
    "code": 0,
    "refer":13
},{
    "code": 1,
    "refer": 14
},{
    "code": 2,
    "refer": 15
}];


var app = express();
app = config(app);
route(app);

var server = app.listen(3000);

global.__viewFolder ='cleeArchive/';
