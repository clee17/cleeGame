var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    id: Number,

    showCode:String,

    title:String,

    author: String,

    workId: String,

    fandom: [String],

    ranking:Number,

    warning:String,

    tag:[Number],

    statements:String,

    ending:String,

    series:[String],

    comments:[Number],

    contents:String
});