var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    application:{type:mongoose.Schema.ObjectId,default:null,ref:'application'},
    type:{type:Number,default:0},
    result:{type:Number,default:0},
    from:{type:mongoose.Schema.ObjectId,default:null,refer:'user_register'},
    date:{type:Date,default:Date.now()},
    contents:{type:String,default:""}
});