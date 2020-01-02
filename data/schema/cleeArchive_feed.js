var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:mongoose.Schema.ObjectId,ref:'user'},
    tag : {type:mongoose.Schema.ObjectId,ref:'cleeArchive_tag'},
    updatedTime:{type:Date,default:Date.now()},
    updatedNumber: {type:Number,default:0},
});