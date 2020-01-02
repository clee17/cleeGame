var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_works');

module.exports = connect.model('works',schema,'works');