var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    infoType:{type:Number,default:0}, // mergeContents

    contents:[{type:mongoose.Schema.ObjectId,default:null}]
});