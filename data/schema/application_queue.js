var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    application:{type:mongoose.Schema.ObjectId,default:null,ref:'application'},
    type:{type:Number,default:0}, //0注册用户，1写作权限，2绘图权限,5获取账单
    date:{type:Date,default:Date.now()}
});