var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_voteOption');

module.exports = connect.model('vote_option',schema,'vote_option');