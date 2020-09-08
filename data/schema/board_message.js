var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    author:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    ip:{type:String,default:""},
    thread:{type:mongoose.Schema.ObjectId,default:null,ref:'board_thread'},
    contents:{type:mongoose.Schema.ObjectId,default:null,ref:'html'},
    grade:{type:Number,default:0},
    createdAt:{type:Date,default:Date.now(),index:1}
});