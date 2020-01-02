var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    fanficEdit: {type:Number,default:113},
    usedTag:[{contents:{type:String,default:''},type:{type:Number,default:0},usedTimes:{type:Number,default:0}}],
    lastLogin:{type:Date,default:Date.now()}
});