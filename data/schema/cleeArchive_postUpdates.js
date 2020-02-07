var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    publisher:{type:mongoose.Schema.ObjectId,default:null},
    receiver:{type:mongoose.Schema.ObjectId,default:null},
    infoType:{type:Number,default:0},
    date:{type:Date,default:Date.now(),index:true},
    updated:{type:Date,default:Date.now(),index:true},
    work:{type:mongoose.Schema.ObjectId,default:null},
    contents:{type:mongoose.Schema.ObjectId,default:null},
    ExtA:{type:mongoose.Schema.ObjectId,default:null},
    ExtB:{type:mongoose.Schema.ObjectId,default:null},
    ExtC:{type:mongoose.Schema.ObjectId,default:null},
    comments:{type:String,default:''},
});