var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_tag');

module.exports = connect.model('tag',schema,'tag');