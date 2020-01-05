var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_msgPool');

module.exports = connect.model('msgPool',schema,'msgPool');