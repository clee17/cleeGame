var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_chapter');

module.exports = connect.model('cleeGame_chapter',schema,'chapters');