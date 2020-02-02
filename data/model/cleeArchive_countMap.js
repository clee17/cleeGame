var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_countMap');

module.exports = connect.model('countMap',schema,'countMap');