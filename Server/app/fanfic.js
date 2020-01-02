global = require('../global');

var express= require('express'),
    config = require('../configure'),
    route = require('../routes/archive/index');

var app = express();

app = config(app);
route(app);

var server = app.listen(3000);
