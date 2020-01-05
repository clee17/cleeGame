var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    publisher:{type:mongoose.Schema.ObjectId,default:null},
    date:{type:Date,default:Date.now()},
    type:{type:Number,default:100},
    channel:[{type:mongoose.Schema.ObjectId,default:null}],
    tags:[{type:mongoose.Schema.ObjectId,default:null}],
    refer:{type:mongoose.Schema.ObjectId,default:null},
    ExtA:{type:mongoose.Schema.ObjectId,default:null},
    ExtB:{type:mongoose.Schema.ObjectId,default:null},
    ExtC:{type:mongoose.Schema.ObjectId,default:null},
});