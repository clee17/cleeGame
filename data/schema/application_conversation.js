var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    application:{type:mongoose.Schema.ObjectId,default:null,ref:'application'},
    date:{type:Date,default:Date.now()},
    contents:{type:String,default:""}
});