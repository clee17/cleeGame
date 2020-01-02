var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    tag:{type:mongoose.Schema.ObjectId,default:null},
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    date:{type:Date,default:Date.now()},
    aid:{type:mongoose.Schema.ObjectId,default:null},
    type:{type:Number,default:0} 
});