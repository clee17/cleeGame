var mongoose = require('mongoose');

var connect = mongoose.createConnection('mongodb://127.0.0.1:27017/clee_archive',{useNewUrlParser: true});

connect.then(
    ()=>{
        console.log('archive database successfully connected');
    },
    err=>{
        console.log("failed to connect to clee_archive");
    }
);

module.exports = connect;