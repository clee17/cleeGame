var connect = require('../connectors/cleeArchive');
var schema = require('../schema/user');

module.exports = connect.model('user',schema,'user');