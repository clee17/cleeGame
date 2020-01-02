var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:String,default:''},
    pwd:{type:String,default:''},
    group:[{type:Number,default:0}]
});