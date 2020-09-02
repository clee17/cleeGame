var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    type:{type:Number,default:0}, //default is single,
    title:{type:String,default:""},
    max:{type:Number,default:10},
    access:{type:Number,default:1},
});