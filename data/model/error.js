var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/valid');

module.exports = connect.model('error',schema,'error');