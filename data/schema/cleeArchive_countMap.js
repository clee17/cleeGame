var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    infoType:{type:Number,default:0},
    number: {type:Number,default:0},
    comment:{type:String,default:''}
});