var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_liked');

module.exports = connect.model('like',schema,'like');