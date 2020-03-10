var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:''},
    from:{type:mongoose.Schema.ObjectId,default:null},
    recipient:[{type:mongoose.Schema.ObjectId,default:null}],
    groups:[{type:Number,default:0}],
    contents:{type:String,default:''},
    sent:{type:Date,default:Date.now()},
});