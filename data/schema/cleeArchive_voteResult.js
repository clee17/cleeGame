var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    description:{type:String,default:''},
    comment:{type:String,default:''},
    ip:{type:String,default:''},
    countryCode:{type:String,default:''},
    voteOption:{type:mongoose.Schema.ObjectId,default:null,ref:"vote_option"},
    vote:{type:mongoose.Schema.ObjectId,default:null,ref:"vote"},
},{
    timestamps: true
});