var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:''},
    type:{},
    totalNum:{type:Number,default:0},
    follower:{type:Number,default:0},
    intro:{type:String,default:''},
    extA:[{type:String,default:''}]
});