var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    work:{type:mongoose.Schema.ObjectId,default:null},

    chapter:{type:mongoose.Schema.ObjectId,default:null},

    user:{type:mongoose.Schema.ObjectId,default:null},

    userName:{type:String,default:'游客'},

    ipa:{type:String,default:null},

    targetUser:{type:mongoose.Schema.ObjectId,default:null,index:true},

    date: {type: Date, default: Date.now},

    status:{type:Number,default:0},

    type:{type:Number,default:1}, // 1是喜欢，2是收藏

});