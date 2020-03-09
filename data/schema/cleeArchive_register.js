var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    data : {type:Date,default:Date.now()},
});