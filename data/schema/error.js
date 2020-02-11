var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    type: {type:Number,default:0},
    comment:{type:String,default:''},
    message:{type:String,default:''},
    date : {type:Date,default:Date.now()},
});