var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_userSetting');

module.exports = connect.model('user_setting',schema,'user_setting');