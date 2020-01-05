var mongoose = require('mongoose');

let userTagSchema = new mongoose.Schema({
    _id:{type:mongoose.Schema.ObjectId,default:null,ref:'tag'},
    contents:{type:String,default:''},
    type:{type:Number,default:0},
    usedTimes:{type:Number,default:0},
},{_id:false});

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    fanficEdit: {type:Number,default:113},
    usedTag:[userTagSchema],
    lastLogin:{type:Date,default:Date.now()}
});