var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    date : {type:Date,default:Date.now()},
    type:{type:Number,default:0}, //0注册用户，1创作者权限,2获取账单
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user_register'},
    statements:{type:String,default:''}, //0,pending, 1 waiting list, 2 granted, 2 denied;
    result:{type:Number,default:0},
});