global = require('../global');

var express = require('express'),
    config = require('../configure');
    route = require('../routes/cleeGame/index');

var app = express();

app = config(app);

route(app);

app.listen(3060);

