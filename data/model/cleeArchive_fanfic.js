var connect = module.require('../connectors/cleeArchive');
var schema = require('../schema/cleeArchive_workChapter');

module.exports = connect.model('work_chapters',schema,'work_chapters');