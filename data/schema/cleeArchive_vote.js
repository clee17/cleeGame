var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:''},
    description:{type:String,default:""},
    maxOption:{type:Number,default:-1},
    start:{type:Date,default:Date.now()},
    end:{type:Date,default:Date.now()+60*1000*60*24*7},
},{
    timestamps: true
});