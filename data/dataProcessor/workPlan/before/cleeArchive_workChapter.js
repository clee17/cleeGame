var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null,index:true},
    book:{type:mongoose.Schema.ObjectId,ref:'works'},
    type:{type:Number,default:1}, //首章编辑状态0, 正常章节编辑状态1，首章发布状态2，正常章节发布状态3；
    intro:{type:String,default:''},
    notes:{type:String,default:""}, //写在前面的话
    fandom: [{type:String,default:''}],
    relationships:[{type:String,default:''}],
    characters:[{type:String,default:''}],
    tag:[{type:String,default:''}],
    warning:[{type:String,default:''}],
    grade: {type:Number,default:0}, // 0, 全年龄向； 1, nc-17; 2 nc-21;
    wordCount: {type:Number,default:0},
    date: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    contents:{type:String,default:'<div class="paragraph"><br class="clear"></div>'},
    visited: {type:Number, default:0},
    lockType: {type:Number,default:0}, //0站内可见，1 站外可见 3 全网可见
    passcode: {use:{type:Boolean,default:false},code:{type:String,default:''}},
    linked:{type:Boolean,default:false},
    published:{type:Boolean,default:false},
    comments:{type:Number,default:0},
});