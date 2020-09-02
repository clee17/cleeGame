var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    mail:{type:String,default:''},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
});