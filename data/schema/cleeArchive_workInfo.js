var mongoose = require('mongoose');


module.exports = new mongoose.Schema({
    intro:{type:String,default:''},
    fandom: [{type:String,default:''}],
    relationships:[{type:String,default:''}],
    characters:[{type:String,default:''}],
    tag:[{type:String,default:''}],
    warning:[{type:String,default:''}],
    grade: {type:Number,default:0}, // 0, 全年龄向； 1, nc-17; 2 nc-21;
    wordCount:{type:Number,default:0},
    order:{type:Number,default:0}
});