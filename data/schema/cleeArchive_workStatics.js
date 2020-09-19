var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    wordCount: {type:Number,default:0},
    visited: {type:Number, default:0},
    commented:{type:Number,default:0},
    visitorCommented:{type:Number,default:0},
    liked:{type:Number,default:0},
    visitorLiked:{type:Number,default:0},
    bookmarked:{type:Number,default:0},
    followed:{type:Number,default:0}
});