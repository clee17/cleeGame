var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_postComment');

module.exports = connect.model('user_validate',schema,'user_validate');