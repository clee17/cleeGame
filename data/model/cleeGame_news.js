var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_info1');

module.exports = connect.model('info1',schema,'info1');