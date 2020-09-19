var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/board_thread');

module.exports = connect.model('board_thread',schema,'board_thread');