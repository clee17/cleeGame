var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    date : {type:Date,default:Date.now()},
    type:{type:Number,default:0}, //0注册用户，1-10创作者权限,11获取账单
    register:{type:mongoose.Schema.ObjectId,default:null,ref:'user_register'},
    statements:{type:String,default:''},
    result:{type:Number,default:0},//0,reviewing, 1 granted, 2 denied, 3 waiting list,
    mail:{type:String},
    status:{type:Number}
});