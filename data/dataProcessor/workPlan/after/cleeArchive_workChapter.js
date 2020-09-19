var mongoose = require('mongoose');
//$unset: intro, notes,fandom,relationships,characters,tag:[{type:String,default:''}],warning,grade;
//$update contents : link to html
//$unset: updated -> updatedAt, date->createdAt
//$unset: lockType and passcode, add new credential;
//$update: comments -> commented， wordCount,visited, commented;  //全局搜索更改很有必要
//$unset, linked, 完全就是彻底的unlinked；
//add ,增加一个一且唯一的index chapter Order,不管怎么删除或者调整顺序，这个order是隐藏起来的代码，不能发生改变。 order_toShow可以更改；
//
module.exports = new mongoose.Schema({
    title:{type:String,default:""},
    order:{type:Number,default:0},
    user:{type:mongoose.Schema.ObjectId,ref:'user',default:null,index:true},
    book:{type:mongoose.Schema.ObjectId,ref:'works'},
    contents:{type:mongoose.Schema.ObjectId,default:null},
    notes:{type:mongoose.Schema.ObjectId,default:null}, //写在前面的序言
    credential:{type:mongoose.Schema.ObjectId,ref:'works_credential'},
    statics:{type:mongoose.Schema.ObjectId,ref:'works_statics'},
    published:{type:Boolean,default:false},
},{timeStamp:true});