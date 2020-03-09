var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_register');

module.exports = connect.model('user_register',schema,'user_register');