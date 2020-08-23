var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_voteResult');

module.exports = connect.model('vote_result',schema,'vote_result');