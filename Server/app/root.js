global = require('../global');

var express = require('express'),
    config = require('../configure'),
    route = require('../routes/cleeGame/index');

global.__websiteInfo = require('../translation/cleegame.js');
global.__errInfo = require('../translation/cleegame_err.js');


var app = express();

route(app);
app = config(app);

var server = app.listen(3060);

global.__viewFolder ='cleeGame/';
