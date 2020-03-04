var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/application');

module.exports = connect.model('application',schema,'application');