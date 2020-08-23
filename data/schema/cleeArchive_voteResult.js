var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    description:{type:String,default:''},
    comment:{type:String,default:''},
    count:{type:Number,default:0},
    voteOption:{type:mongoose.Schema.ObjectId,default:null,ref:"voteOption"},
},{
    timestamps: true
});