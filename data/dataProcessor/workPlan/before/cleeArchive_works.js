var mongoose = require('mongoose');

let feedBackSchema = new mongoose.Schema({
    _id:{type:mongoose.Schema.ObjectId,default:null,ref:'tag'},
    contents:{type:String,default:''},
    type:{type:Number,default:0},
    usedTimes:{type:Number,default:0},
},{_id:false});


module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user',index:true},
    type:{type:Number,default:0}, //0 同人文
    status:{type:Number,default:0},//狀態，0已完结，1连载中。
    published:{type:Boolean,default:false},
    date: { type: Date, default: Date.now },
    chapterCount: {type:Number,default:0},
    updated: {type:Date,default:Date.now()},
    comments: {type:Number,default:0},
    liked:{type:Number,default:0},
    visitorLiked:{type:Number,default:0},
    bookmarked: {type:Number,default:0}, //收藏人数
});