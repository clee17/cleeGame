var mongoose = require('mongoose');
var schema = require('../schema/access');

module.exports = mongoose.model('access',schema,'clee_access');