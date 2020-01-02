var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/register');

module.exports = connect.model('user_register',schema,'user_register');