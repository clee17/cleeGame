var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_postComment');

module.exports = connect.model('post_comment',schema,'post_comment');