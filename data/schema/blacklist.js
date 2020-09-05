var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    start:{type:Date,default:Date.now()},//开始事件
    end:{type:Date,default:Date.now()+1000*60*60*24*7},//结束时间
    user:{type:mongoose.Schema.ObjectId,default:null,ref:'users'},
    ip:{type:String,default:""},
    type:{type:Number,default:0}, //黑名单针对的关联类型，0全区，1特定board；
    area:{type:mongoose.Schema.ObjectId,default:null},
},{
    timestamps: {createdAt:true,updatedAt:false}
});