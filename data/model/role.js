var connect = require('../connectors/cleeArchive');
var schema = require('../schema/role');

module.exports = connect.model('role',schema,'role');