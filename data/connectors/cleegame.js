var mongoose = require('mongoose');

var connect = mongoose.createConnection('mongodb://127.0.0.1:27017/clee_game',{useNewUrlParser: true});

connect.then(
    ()=>{
        console.log('game database successfully connected');
    },
    err=>{
        console.log("failed to connect to clee_game");
    }
);

module.exports = connect;