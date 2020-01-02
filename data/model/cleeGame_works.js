var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_works');

module.exports = connect.model('works',schema,'works');