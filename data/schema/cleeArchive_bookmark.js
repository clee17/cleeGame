var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:mongoose.Schema.ObjectId,ref:'user'},
    works : {type:mongoose.Schema.ObjectId,ref:'cleeArchive_tag'},
    chapters : [{type:mongoose.Schema.ObjectId,ref:'cleeArchive_fanfic'}],
    updatedTime:{type:Date,default:Date.now()}
});