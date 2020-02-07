var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_postLiked');

module.exports = connect.model('post_like',schema,'post_like');