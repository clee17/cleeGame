var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:''},
    searchName:{type:String,default:'',index:true},
    type:{type:Number,default:0},
    visited:{type:Number,default:0},
    totalNum:{type:Number,default:0},
    workNum:{type:Number,default:0},
    follower:{type:Number,default:0},
    intro:{type:String,default:''},
    updated:{type:Date,default:Date.now(),index:true},
    extA:[{type:String,default:''}]
});