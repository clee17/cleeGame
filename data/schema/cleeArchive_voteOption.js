var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:''},
    description:{type:String,default:''},
    count:{type:Number,default:0},
    vote:{type:mongoose.Schema.ObjectId,default:null,ref:"vote"},
},{
    timestamps: true
});