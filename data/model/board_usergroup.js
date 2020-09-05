var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/board_usergroup');

module.exports = connect.model('board_usergroup',schema,'board_usergroup');