var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    fanficEdit: {type:Number,default:113},
    preference: {type:Number,default:29},
    access:[{
        index:{type:Number,default:0},
        requested:{type:Date,default:Date.now()},
        joined:{type:Date,default:Date.now()}}],
    lastLogin:{type:Date,default:Date.now()}
});