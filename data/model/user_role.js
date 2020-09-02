var connect = require('../connectors/cleeArchive');
var schema = require('../schema/user_role');

module.exports = connect.model('user_role',schema,'user_role');