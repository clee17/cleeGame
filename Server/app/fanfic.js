global = require('../global');

var express= require('express'),
    config = require('../configure'),
    route = require('../routes/archive/index');

global.__websiteInfo = require('../translation/archive.js');
global.__errInfo = require('../translation/archive_err.js');
global.__statements = require('../translation/archive_statements.js');
global.__infoAll = require('../translation/info.js');

var app = express();
app = config(app);
route(app);

var server = app.listen(3000);
