var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    fanficEdit: {type:Number,default:113},
    access:[{type:Number,default:0}],
    lastLogin:{type:Date,default:Date.now()}
});