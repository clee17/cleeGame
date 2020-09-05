var mongoose = require('mongoose');

// 000001 开放发帖;
// 000010 开放回复
// 000100 开放时间更新（需要添加updated time index)

module.exports = new mongoose.Schema({
    type:{type:Number,default:0}, //0也不知道有什么用处，但放着就放着吧。
    owner:{type:mongoose.Schema.ObjectId,default:null,ref:'user'},
    title:{type:String,default:""},
    description:{type:String,default:''},
    category:[{order:{type:Number,default:0},name:{type:String,default:""}}],
    setting:{type:Number,default:0},//通过属性来控制board，例如
},{
    timestamps:true
});