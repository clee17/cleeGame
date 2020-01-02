var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},

    author:{type:mongoose.Schema.ObjectId,default:null},

    type:{type:Number,default:2000},

    cover: {type:String,default:"/img/coverDefault.png"},

    subTitle:{type:String,default:""},

    tag:[{type:String}],

    first:{type:mongoose.Schema.ObjectId,default:null,ref:'cleeGame_chapter'},

    statements:{type:String,default:""}, //聲明

    intro: {type:String,default:""}, //劇情簡介

    gameLink: {type:String,default:""},

    status:{type:Number,default:0},//狀態，0連載中，1已完結。

    date: { type: Date, default: Date.now },

    visited: {type:Number, default:0},

    liked: {type:Number,default:0}, //收藏人数

    ext1: {type:Number,default:0}, //卷数统计

    ext2: {type:Number,default:0},

    ext3: {type:String,default:''},

    wordCount: {type:Number,default:0},

    chapCount: {type:Number,default:0},

    updated: {type:Date,default:Date.now()}
});