var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    author:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    ip:{type:String,default:""},
    thread:{type:mongoose.Schema.ObjectId,default:null,ref:'board_thread'},
    contents:{type:mongoose.Schema.ObjectId,default:null,ref:'html'},
    status:{type:Number,default:0}, //0 normal 1 blocked
    grade:{type:Number,default:0},
    threadIndex:{type:Number,default:1},
    createdAt:{type:Date,default:Date.now(),index:1}
});