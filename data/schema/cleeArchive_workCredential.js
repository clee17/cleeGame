var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    lockType: {type:Number,default:0}, //0站内可见，1 站外可见 3 全网可见
    passcode: {use:{type:Boolean,default:false},code:{type:String,default:''}},
});