var connect = module.require('../connectors/cleeContents');
var schema = require('../schema/cleeContents_board');

module.exports = connect.model('board_current',schema,'board_current');