var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_gameInfo');

module.exports = connect.model('game_info',schema,'game_info');