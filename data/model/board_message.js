var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/board_message');

module.exports = connect.model('board_message',schema,'board_message');