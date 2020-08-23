var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    description:{type:String,default:''},
    comment:{type:String,default:''},
    count:{type:Number,default:0},
    vote:{type:mongoose.Schema.ObjectId,default:null,ref:"vote"},
},{
    timestamps: true
});