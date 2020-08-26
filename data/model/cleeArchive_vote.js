var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_vote');

module.exports = connect.model('vote',schema,'vote');