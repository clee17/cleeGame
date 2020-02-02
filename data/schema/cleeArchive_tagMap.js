var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    tag:{type:mongoose.Schema.ObjectId,default:null,index:true},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user',index:true},
    date:{type:Date,default:Date.now(),index:true},
    work:{type:mongoose.Schema.ObjectId,default:null},
    aid:{type:mongoose.Schema.ObjectId,default:null},
    type:{type:Number,default:0},
    infoType:{type:Number,default:0}
});