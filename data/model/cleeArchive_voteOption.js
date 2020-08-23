var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_voteOption');

module.exports = connect.model('voteOption',schema,'voteOption');