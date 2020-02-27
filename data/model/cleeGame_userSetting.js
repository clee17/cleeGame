var connect = module.require('../connectors/cleegame');
var schema = require('../schema/cleeGame_userSetting');

module.exports = connect.model('user_setting',schema,'user_setting');