var path = require('path'),

    crypto = require('crypto'),

    db_user = require(path.join(__dataModel,'user_base')),
    db_user_identity = require(path.join(__dataModel,'user_identity'));

function tableModel(height,data,name){
    this.initialize = function(height,data,name){
        this.height = height;
        this.data = data;
        this.name = name;
        this.limit = 20;
        this.model = {};
    };

    this.initialize(height,data,name);

    return this;
};

var tableIndex = new Map();

tableIndex[10000] = tableModel(1,db_user_identity,"user_identity");
tableIndex[10000].model = {
    "code":{"Type":"String","must":false,"edit":false},
    "md51":{"Type":"String","must":false,"edit":false},
    "md52":{"Type":"String","must":false,"edit":false},
    "md53":{"Type":"String","must":false,"edit":false},
    "user":{"Type":"ObjectId","must":false,"edit":true},
};
tableIndex[10000].add = function(){
    if(!this.data)
        return;
    var instance = new this.data;
    var str= instance._id.toString();
    var  md5= crypto.createHash('md5');
    instance.md51 = md5.update(str.slice(0,str.length/2)).digest('hex');
    md5 =   crypto.createHash('md5');
    instance.md52 = md5.update(str.slice(str.length/2)).digest('hex');
    md5 =   crypto.createHash('md5');
    instance.md53 = md5.update(str).digest('hex');
    instance.user = null;
    instance.save();
};
tableIndex[10000].options = ['add','update'];

tableIndex[10001] = new tableModel(1,db_user,"root_user");
tableIndex[10001].model = {
    "userName":{"Type":"String","must":true,"edit":true},
    "password":{"Type":"String","must":true,"edit":true},
    "subAccountFanfic": {"Type":"ObjectId","must":false,"edit":true},
    "SubAccountGame":{"Type":"ObjectId","must":false,"edit":true},
    "SubAccountArchive":{"Type":"ObjectId","must":false,"edit":true},
    "inviteCode":{"Type":"ObjectId","must":true,"edit":false},
};


var tableHandler = {
    requestTable:async function(index,limit,entryIndex){
        if(tableIndex[index])
        {
            if(tableIndex[index].cleegame == "user_identity")
            {

            }
            var dataLimit = tableIndex[index].limit;
            if(limit != undefined)
                dataLimit = limit;
            let response = {};

            response.max = await tableIndex[index].data.countDocuments();
            if(entryIndex != undefined)
            {
                response.dataBase = await tableIndex[index].data.find({'_id':{"$lt":entryIndex}}).limit(dataLimit);
            }
            else{
                response.dataBase = await tableIndex[index].data.find().limit(dataLimit);
            }

            for(var i=0;i<response.dataBase.length;++i){
                response.dataBase[i]._id = response.dataBase[i]._id.toString();
            }

            response.model = tableIndex[index].model;
            response.options = tableIndex[index].options;

            return response;
        }
    },

    tableAdd:async function(index)
    {

    }

};

module.exports = tableHandler;