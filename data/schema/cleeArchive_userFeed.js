var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user',index:true},
    inbox:{type:Number,default:0},
    admin:{type:Number,default:0}, //已经阅读的admin邮件数量
    feedback:{type:Date,default:Date.now()},
    bookmarked:{type:Date,default:Date.now()},
});