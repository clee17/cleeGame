var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_tagMap');

module.exports = connect.model('tag_map',schema,'tag_map');