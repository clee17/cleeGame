var mongoose = require('mongoose');

module.exports = new mongoose.Schema({

    title:{type:String,default:""},

    works: {type:mongoose.Schema.ObjectId,ref:'works'},

    author:{type:mongoose.Schema.ObjectId,default:null},

    type: {type:Number,default:3000},

    order: {type:Number,default:-1},

    index: {type:Number,default:-1},

    prev: {type:mongoose.Schema.ObjectId,ref:'cleeGame_chapter',default:null},

    next: {type:mongoose.Schema.ObjectId,ref:'cleeGame_chapter',default:null},

    wordCount: {type:Number,default:0},

    date: { type: Date, default: Date.now },

    tag:[{type:String}],

    contents:{type:String,default:""},

    ext1: {type:Number,default:0},

    ext2: {type:Number,default:0},

    ext3: {type:String,default:''},  //作者感言

    ext4: [{type:mongoose.Schema.ObjectId,ref:'cleeGame_chapter'}],

    visited: {type:Number, default:0},

    liked: {type:Number,default:0},

    comments: [mongoose.Schema.ObjectId]
});