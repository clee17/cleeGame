var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    mail:{type:String,default:''},
    intro:{type:String,default:''},
    logged:{type:Date,default:Date.now()},
});