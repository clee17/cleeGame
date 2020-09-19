var mongoose = require('mongoose');

// 000001 发帖
// 000010 回帖
// 000100 删帖
// 001000 禁言
// 010000 屏蔽

module.exports = new mongoose.Schema({
    board:{type:mongoose.Schema.ObjectId,default:null,ref:'board'},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'users'},
    ip:{type:String,default:''},
    access:{type:Number,default:1},
},{timestamps:true});