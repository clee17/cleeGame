var mongoose = require('mongoose');

var connect = mongoose.createConnection('mongodb://127.0.0.1:27017/clee_contents',{useNewUrlParser: true});

connect.then(
    ()=>{
        console.log('contents database successfully connected');
    },
    err=>{
        console.log("failed to connect to clee_contents");
    }
);

module.exports = connect;