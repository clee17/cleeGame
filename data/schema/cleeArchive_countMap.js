var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    refer:{type:mongoose.Schema.ObjectId,default:null},
    infoType:{type:Number,default:0},
    number: {type:Number,default:113},
});