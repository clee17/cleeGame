var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
        id: Number,

        type: String,

        name: String,

        contents: String
    });