var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/blacklist');

module.exports = connect.model('blacklist',schema,'blacklist');