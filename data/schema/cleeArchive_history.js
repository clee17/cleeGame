module.exports = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,default:null},
    type: {type:Number,default:0}, //0是文章浏览，1是使用过的tag
    contents:{type:String,default:''}, //通过JSONparse的方法把内容找出来；
});