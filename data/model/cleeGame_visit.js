var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_visit');

module.exports = connect.model('visit',schema,'visit');