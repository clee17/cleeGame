var connect = module.require('../connectors/fanfic');
var schema = require('../schema/fanfic_content');

module.exports = connect.model('fanfic_content',schema,'fanfic_content');