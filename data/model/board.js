var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/board');

module.exports = connect.model('board',schema,'board');