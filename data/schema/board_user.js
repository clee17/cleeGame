var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    board:{type:mongoose.Schema.ObjectId,default:null,ref:'board'},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'users'},
    access:{type:Number,default:1},
});