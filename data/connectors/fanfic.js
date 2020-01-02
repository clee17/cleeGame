var mongoose = require('mongoose');

var connect = mongoose.createConnection('mongodb://127.0.0.1:27017/clee_fanfic',{useNewUrlParser: true});

connect.then(
    ()=>{
        console.log('fanficDataBase successfully connected');
    },
    err=>{
        console.log("failed to connect to fanfic database");
    }
);

module.exports = connect;