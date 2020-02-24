let mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name:{type:String,default:""},
    path:{
        CN:{type:String,default:""},
        OTHER:{type:String,default:""}
    },
    dependencies:[{type:String,default:""}]
});