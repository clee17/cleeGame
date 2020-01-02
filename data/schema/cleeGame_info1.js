var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},

    author:{type:mongoose.Schema.ObjectId,default:null},

    type:{type:Number,default:1000},

    subType:{type:String,default:""},

    date: { type: Date, default: Date.now },

    visited: {type:Number, default:0},

    liked: {type:Number,default:0},

    tag:[mongoose.Schema.ObjectId],

    contents:{type:String,default:""}
});