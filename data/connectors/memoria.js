var mongoose = require('mongoose');

var connect  = mongoose.createConnection('mongodb://127.0.0.1:27017/memoria',{useNewUrlParser: true});
connect.then(
    ()=>{
        console.log('game memoria database successfully connected');
    },
    err=>{
        console.log("failed to connect to memoria database");
    }
);

module.exports = connect;