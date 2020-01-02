var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_workIndex');

module.exports = connect.model('work_index',schema,'work_index');