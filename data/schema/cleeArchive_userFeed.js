var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user',index:true},
    inbox:{type:Number,default:0},
    inboxAll:{type:Number,default:0},
    feedback:{type:Number,default:0},
    feedbackRead:{type:Number,default:0},
    bookmarked:{type:Number,default:0},
    bookmarkedAll:{type:Number,default:0}, //作者（章节作品全都提供）、作品（只提供更新章节提示)
});