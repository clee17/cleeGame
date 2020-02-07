var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    ipa:{type:String,default:''},
    status:{type:Number,default:0},
    valid: {type:Date, default:Date.now(),expires:'60m'}
});