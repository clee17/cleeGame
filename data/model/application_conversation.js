var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/application_conversation');

module.exports = connect.model('application_conversation',schema,'application_conversation');