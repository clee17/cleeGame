var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_gameModules');

module.exports = connect.model('game_modules',schema,'game_modules');