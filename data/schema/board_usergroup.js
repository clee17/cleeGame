var mongoose = require('mongoose');

// 000001 发帖
// 000010 回帖
// 000100 删帖
// 001000 禁言
// 010000


module.exports = new mongoose.Schema({
    title:{type:String,default:""}, //name of usergroup;
    maxCount:{type:Number,default:10},//用户组最大成员数量
    board:{type:mongoose.Schema.ObjectId,default:null,ref:'board'},
    users:[{type:mongoose.Schema.ObjectId,default:null,ref:'users'}],
    ips:[{type:String}],
    type:{type:Number,default:0}, //10 ，特殊类型，访客类型
    access:{type:Number,default:1},
},{
    timestamps:true
});