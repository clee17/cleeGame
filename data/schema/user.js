var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:String,default:''},
    pwd:{type:String,default:''},
    userGroup: {type:Number,default:0},
    mail:{type:String,default:''},
    intro:{type:String,default:''},
    points:{type:Number,default:0},
    registered:{type:Date,default:Date.now()},
    register:{type:mongoose.Schema.ObjectId,default:null,ref:'user_register'}
});