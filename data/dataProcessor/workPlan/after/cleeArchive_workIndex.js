var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    work:{type:mongoose.Schema.ObjectId,default:null,ref:'works'},

    chapter:{type:mongoose.Schema.ObjectId,default:null,ref:'work_chapters'},

    info:{type:mongoose.Schema.ObjectId,default:null,ref:'work_info'},

    level:{type:Number,default:0}, //收入几级目录

    order:{type:Number,default:0,index:0}, //章节序号

    parent:{type:mongoose.Schema.ObjectId,default:null,ref:'work_index'},  //父章节是什么

    prev:{type:mongoose.Schema.ObjectId,default:null},

    next:{type:mongoose.Schema.ObjectId,default:null},

    type:{type:Number,default:0},

    //:   0是同人小说;   1是文章摘录； 3是文章推荐；
});