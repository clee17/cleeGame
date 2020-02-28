var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    user: {type:String,default:''},
    pwd:{type:String,default:''},
    userGroup: {type:Number,default:0},
    points:{type:Number,default:0},
});