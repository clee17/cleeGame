var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    type:{type:Number,default:0}, //0 tag, 1 user, 2 series, 3 book, 4 events;
    target:{type:mongoose.Schema.ObjectId,default:null},
    status:{type:Boolean,default:false},
    date:{type:Date,default:Date.now()},
});