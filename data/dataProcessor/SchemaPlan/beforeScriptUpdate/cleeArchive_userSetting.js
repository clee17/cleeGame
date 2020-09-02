var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    fanficEdit: {type:Number,default:113},
    preference: {type:Number,default:29},
    access:[{type:Number,default:0}],
    role:{type:Number,default:0},
    lastLogin:{type:Date,default:Date.now()}
});