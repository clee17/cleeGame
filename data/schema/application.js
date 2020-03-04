var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    mail:{type:String,default:''},
    type:{type:Number,default:0}, //0注册用户，1创作者权限,2获取账单
    subType:{type:Number,default:0},
    statements:{type:String,default:''},
    count:{type:Number,default:0},
    response:{type:Boolean,default:false},
    status:{type:Number,default:0},//申请中，1已接受并发送注册码 2 已拒绝 3 已注册
    date : {type:Date,default:Date.now()},
});