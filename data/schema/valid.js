var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    date : {type:Date,default:Date.now()},
    type: {type:Number,default:0}, //0重新设置密码；
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    valid: {type:Date, default:Date.now(),expires:'1440m'},
});