var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_postUpdates');

module.exports = connect.model('post_updates',schema,'post_updates');