var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    works: {type:mongoose.Schema.ObjectId},

    ip:{type:String,default:""},

    valid: {type:Date, default:Date.now(),expires:'10m'}
});