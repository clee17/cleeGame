var mongoose = require('mongoose');

//置顶帖单独开一个表格吧；
let schema = new mongoose.Schema({
    title:{type:String,default:""}, //0也不知道有什么用处，但放着就放着吧。
    html:{type:mongoose.Schema.ObjectId,default:null,ref:'html'},
    board:{type:mongoose.Schema.ObjectId,default:null,ref:'board'},
    ip:{type:String,default:""},
    author:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    grade:{type:Number,default:0},
    category:{type:Number,default:0},
    replied:{type:Number,default:0} ,//统计被回复的数量；
    visited:{type:Number,default:0} ,//统计被阅读的数量
    repliedAt:{type:Date,default:null}
},{
    timestamps: {createdAt:true,updatedAt:false}
});

schema.index({"createdAt": -1,"repliedAt":-1});

module.exports = schema;