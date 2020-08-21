var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    mail:{type:String,default:''},
    user:{type:mongoose.ObjectId,default:null,ref:'user'},
    intro:{type:String,default:''},
    logged:{type:Date,default:Date.now()},
    ip:{type:String,default:""}
});