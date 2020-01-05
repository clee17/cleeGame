let chapterModel = require('./../model/cleeArchive_fanfic'),
    tagModel = require('./../model/cleeArchive_tag'),
    tagMapModel = require('./../model/cleeArchive_tagMap'),
    userSettingModel = require('./../model/cleeArchive_userSetting');

let fs = require('fs'),
    path = require('path');

let redis = require('redis'),
    redisClient = redis.createClient();

var argv = process.argv;
console.log(argv);

let calcTag = function(){
    let type = [1];
    let tagMap = new Map();
    let tagUser = new Map();
    let tagDetailMap = new Map();

    let totalNum = 0;
    let processed = 0;
    let process = 0;

    let nextStep = function(){
        switch(process)
        {
            case 0:
                calcAll(type[0]);
                break;
            case 1:
                processAllTag(type[0]);
                break;
            case 2:
                nextType();
                break;
            case 5:
                writeDetailedTag();
                break;
            case 10:
                writeCount();
                break;
            case 15:
                writeTagUser();
                break;
            case 200:
                finalProcess();
                break;
            case 505:
                break;
        }
    };

    let finalProcess = function(){
        console.log('共计'+totalNum+'条数据已完成扫描');
        process = 505;
    };

    let writeDetailedTag = function(){
        let list = [];

        let writeDetail = function(){
            if(list.length ==0)
            {
                process= 10;
                nextStep();
                return;
            }
            let option = list.pop();
            console.log('开始写入'+unescape(option.tag));
            console.log(option);
            tagModel.findOneAndUpdate({name:unescape(option.tag)},{},{new: true, upsert: true,setDefaultsOnInsert: true}).exec()
                .then(function(doc){
                    if(doc)
                        return tagMapModel.findOneAndUpdate({tag:doc._id,aid:option.aid,type:option.type,user:option.user},{},{new: true, upsert: true,setDefaultsOnInsert: true}).exec();
                    else
                        throw option.tag+'存入失败';
                })
                .then(function(doc){
                    if(!doc)
                        throw unescape(option.tag)+'章节链接索引更新失败';
                    else
                        writeDetail();
                })
                .catch(function(err){
                    console.log(err);
                    writeDetail(option);
                });
        };

        tagDetailMap.forEach(function(value,key){
            list.push(value);
            if(list.length == tagDetailMap.size)
                writeDetail();
        });
    };

    let writeTagUser = function(){
        let list = [];
        let writeSettings = function(){
            if(process != 15)
                return;
            if(list.length == 0)
            {
                console.log('用户设定更新完成');
                process=200;
                nextStep();
                return;
            }

            let entry = list.pop();
            let subTag = [];
            if(entry.length>1)
                subTag = JSON.parse(JSON.stringify(entry[1].usedTag));

            let writeToTable = function(){
                console.log(entry[1]);
                if(!entry[1])
                {
                    console.log('有单独记录');
                    let process = 505;
                    nextStep();
                }
                userSettingModel.findOneAndUpdate(entry[0],entry[1],function(err,doc){
                    if(err)
                    {
                        console.log(err);
                        process = 505;
                        nextStep();
                    }
                    else{
                        if(doc)
                            console.log('写入成功：'+JSON.stringify(doc));
                        else
                            console.log('写入失败');
                        writeSettings();
                    }
                })
            };

            let processEntry = function(){
                if(!subTag)
                    return;
                if(subTag.length == 0)
                    {
                        writeToTable();
                        return;
                    }
                let item = subTag.pop();
                tagModel.findOne({name:item.contents},function(err,doc){
                    if(err)
                        console.log(err);
                    else if(doc)
                        entry[1].usedTag.forEach(function(item,i,arr){
                            if(item.contents == doc.name)
                                item._id = doc._id;
                        });
                    processEntry();
                });
            };

            processEntry();
        };

        tagUser.forEach(function(value,key){
            list.push([{user:key},{usedTag:value}]);
            if(list.length == tagUser.size)
                writeSettings();
        });
    };

    let writeCount = function(){
        let multiRedisCommands = [];
        let bulkWrite = [];
        tagMap.forEach(function(value,key){
            multiRedisCommands.push(["set",'tag_count_'+key,value]);
            bulkWrite.push({updateOne:{'filter':{'name':unescape(key)},'update':{'totalNum':value}}});
        });
        redisClient.multi(multiRedisCommands).exec(function(err,replies){
            if(err)
            {
                process = 505;
                nextStep();
                return;
            }
            tagModel.bulkWrite(bulkWrite)
                .then(function(docs){
                    console.log(docs);
                    process = 15;
                    nextStep();
                })
                .catch(function(err){
                    console.log(err);
                    process = 505;
                    nextStep();
                })
        });
    };

    let nextType = function(){
        if(type.length == 0)
            process = 5;
        else
            process = 0;
        nextStep();
    };

    let calcAll = function(subType){
        chapterModel.countDocuments({type:subType}).exec()
            .then(function(num){
                process = 1;
                totalNum += num;
                nextStep();
            })
            .catch(function(err){
                console.log(err);
                process = 505;
                nextStep();
            })
    };

    let processAllTag = function(subType){
        if(processed >= totalNum)
        {
            let result = type.splice(0,1);
            console.log('类型'+result+'执行结束');
            process=2;
            nextStep();
            return;
        }

        chapterModel.find({type:subType},null,{skip:processed,limit:50,sort:{_id: -1}},function(err,docs){
            if(err)
            {
                console.log(err);
                process = 505;
                nextStep();
            }
            else{
                docs.map(function(item,i,arr){
                    let fandom = item.fandom;
                    let relationships = item.relationships;
                    let characters = item.characters;
                    let tag = item.tag;
                    let id = item._id.toString();
                    let user = item.user.toString();

                    let setData = function(item,data,subTagType){
                        let index = escape(item);
                        if(!tagMap.get(index))
                            tagMap.set(index,1);
                        else
                            tagMap.set(index,tagMap.get(index)+1);

                        let tagUserContents = [{type:subTagType,contents:item,usedTimes:1}];
                        if(!tagUser.get(user)) {
                            tagUser.set(user, tagUserContents);
                        }
                        else
                        {
                            tagUserContents = tagUser.get(user);
                            let existed = false;
                            tagUserContents.forEach(function(subItem,i,arr){
                                if(subItem.contents == item)
                                {
                                    subItem.usedTimes++;
                                    existed = true;
                                }
                            });
                            if(!existed)
                                tagUserContents.push({type:subTagType,contents:item,usedTimes:1});
                            tagUser.set(user,tagUserContents);
                        }

                        let tagDetailIndex = id+'_'+index;
                        let tagDetailContents = {type:subTagType,user:user,tag:index,aid:id};
                        tagDetailMap.set(tagDetailIndex,tagDetailContents);
                    };

                    if(fandom)
                        fandom.map(function(item,i,arr){
                            setData(item,'fandom',1);
                        });

                    if(relationships)
                        relationships.map(function(item,i,arr){
                            setData(item,'relationships',2);
                        });

                    if(characters)
                        characters.map(function(item,i,arr){
                            setData(item,'characters',3);
                        });

                    if(tag)
                        tag.map(function(item,i,arr){
                            setData(item,'tag',4);
                        });

                    processed++;
                });
                nextStep();
            }
        })
    };

    nextStep();
};

let readSettings = function () {
    redisList = ['grade','warning'];
    let readResult = fs.readFile('./../json/fanficEdit.json', {encoding: 'utf-8'},(err,File)=>{
        if(err)
        {
           console.log(err);
        }
        else{
            let settings = JSON.parse(File);
            let redisCondition = [];
            let redisDocs = [];
            let multiRedisCommands = [];
            while(redisList.length>0)
            {
                let keyString = redisList.pop();
                let value = settings[keyString];
                keyString = 'fanfic_'+keyString;
                multiRedisCommands.push(['set',keyString,JSON.stringify(value)]);
            }
            console.log(multiRedisCommands);
            redisClient.multi(multiRedisCommands).exec(function(err,replies){
                console.log('finished writing');
                if(err)
                    console.log(err);
                else
                {
                    console.log(replies);
                    console.log('设置对象写入完成');
                }
            });
        }
    });
};

switch(argv[2])
{
    case 'setting':
        readSettings();
        break;
    case 'tagCount':
        calcTag();
        break;
    default:
        console.log('输入无效的指令');
        break;
}



