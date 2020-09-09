var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    user:{type:mongoose.Schema.ObjectId,ref:'user'},
    book:{type:mongoose.Schema.ObjectId,ref:'cleeArchive_book'},
    type:{type:Number,default:2000}, //首章
    notes:{type:String,default:""}, //章节介绍
    fandom: [{type:mongoose.Schema.ObjectId,ref:'archive_fandom'}],
    relationships:[{type:String,default:""}],
    tag:[{type:String,default:''}],
    rate: {type:Number,default:0}, // 0, 全年龄向； 1, nc-17; 2 nc-21;
    wordCount: {type:Number,default:0},
    date: { type: Date, default: Date.now },
    contents:{type:String,default:""},
    visited: {type:Number, default:0},
    liked: {type:Number,default:0},
    lockType: {type:Number,default:0}, //0不上锁，1使用全文锁，2使用单章锁；
    showcode: {type:String,default:''},
});