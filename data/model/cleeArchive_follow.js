var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_follow');

module.exports = connect.model('user_follow',schema,'user_follow');