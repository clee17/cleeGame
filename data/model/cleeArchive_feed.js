var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_feed');

module.exports = connect.model('cleeArchive_feeds',schema,'feeds');