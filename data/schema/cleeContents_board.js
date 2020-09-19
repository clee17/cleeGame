var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    type:{type:Number,default:0}, //0也不知道有什么用处，但放着就放着吧。
    contents:{type:String,default:""},
    link:{type:mongoose.Schema.ObjectId,default:null},
    path:{type:String,default:""}
});