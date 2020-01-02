var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    works: {type:mongoose.Schema.ObjectId},

    ip:{type:String,default:""},

    date: {type:Date, default:Date.now()}
});