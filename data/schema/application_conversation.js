var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    application:{type:mongoose.Schema.ObjectId,default:null,ref:'application'},
    from:{type:mongoose.Schema.ObjectId,default:null,refer:'user_register'},
    date:{type:Date,default:Date.now()},
    contents:{type:String,default:""}
});