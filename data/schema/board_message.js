var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    author:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    thread:{type:mongoose.Schema.ObjectId,default:null,ref:'board_thread'},
    contents:{type:mongoose.Schema.ObjectId,default:null,ref:'html'},
    createdAt:{type:Date,default:Date.now(),index:1}
});