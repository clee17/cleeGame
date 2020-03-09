var mongoose = require('mongoose');

module.exports = new mongoose.Schema({
        id: Number,
    access: [String]
    });