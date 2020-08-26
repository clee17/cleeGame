var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:String,default:''},
    pwd:{type:String,default:''},
    userGroup: {type:Number,default:0},
    mail:{type:String},
    points:{type:Number,default:0},
    createdAt:{type:Date,default:Date.now()},
    register:{type:mongoose.Schema.ObjectId,default:null,ref:'user_register'}
},{
    timestamps:true
});