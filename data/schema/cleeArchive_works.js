var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},

    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},

    type:{type:Number,default:0}, //0 同人文

    status:{type:Number,default:0},//狀態，0已完结，1连载中。

    published:{type:Boolean,default:false},

    date: { type: Date, default: Date.now },

    bookmarked: {type:Number,default:0}, //收藏人数

    wordCount: {type:Number,default:0},

    chapterCount: {type:Number,default:1},

    updated: {type:Date,default:Date.now()}
});