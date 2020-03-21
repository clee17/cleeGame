var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    title:{type:String,default:""},

    user:{type:mongoose.Schema.ObjectId,default:null},

    version:{type:String,default:""},

    path:{type:String,default:""},

    type:{type:Number,default:1000},

    md5:{type:String,default:""},

    resolution:{
        width:{type:Number,default:1280},
        height:{type:Number,default:720}
    },

    exchangeRate:{type:Number,default:100},

    modules:[{type:String,default:""}],

    date: { type: Date, default: Date.now },

    update: { type: Date, default: Date.now },

    liked: {type:Number,default:0},

    description:{type:String,default:""}
});