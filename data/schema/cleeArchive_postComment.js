var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    infoType:{type:Number,default:-1},

    work:{type:mongoose.Schema.ObjectId,default:null},

    chapter:{type:mongoose.Schema.ObjectId,default:null},

    user:{type:mongoose.Schema.ObjectId,default:null},

    userName:{type:String,default:'游客'},

    ipa:{type:String,default:null},

    targetUser:{type:mongoose.Schema.ObjectId,default:null},

    targetUserName:{type:String,default:''},

    date: {type: Date, default: Date.now},

    parent:{type:mongoose.Schema.ObjectId,default:null},

    contents:{type:String,default:''},

});