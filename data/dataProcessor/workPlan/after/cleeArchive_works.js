var mongoose = require('mongoose');

//unset: comments->commented,liked:,visitorLiked,bookmarked,followed;

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user',index:true},
    type:{type:Number,default:0}, //0 同人文
    status:{type:Number,default:0},//狀態，0已完结，1连载中。
    published:{type:Boolean,default:false},
    date: { type: Date, default: Date.now },
    chapterCount: {type:Number,default:0},
    chapterDeleted: {type:Number,default:0},
    updated: {type:Date,default:Date.now()},
},{timeStamps:true});