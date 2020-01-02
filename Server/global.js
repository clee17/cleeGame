var path = require('path');
let aRedis = require("async-redis");

global.__basedir = path.join(path.resolve(__dirname),'../');

global.__view = path.join(path.join(__basedir,'/View/'));
global.__routes = path.join(path.join(__basedir,'/Server/routes/'));
global.__utils = path.join(path.join(__basedir,'/js/Utility/'));

global.__dataSchema = path.join(path.join(__basedir,'/data/schema/'));
global.__dataModel = path.join(path.join(__basedir,'data/model/'));
global.__dataConnec = path.join(path.join(__basedir,'/data/connectors/'));
global.__dataFormat = path.join(path.join(__basedir,'/data/dataProcessor/'));

global.__entryFile = ['index.html'];

global.__allowedIP = ['180.174.9.230','114.87.146.69','116.238.30.251','114.82.11.15'];

let redis = require('redis');
global.redisClient = redis.createClient();
global.asyncRedis = aRedis.createClient();


module.exports = global;

