var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    settings: {type:Number,default:113},
    accessLevel:{type:Number,default:0},
    lastLogin:{type:Date,default:Date.now()}
});