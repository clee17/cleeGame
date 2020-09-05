var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/board_user');

module.exports = connect.model('board_user',schema,'board_user');