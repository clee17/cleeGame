var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/application_queue');

module.exports = connect.model('application_queue',schema,'application_queue');