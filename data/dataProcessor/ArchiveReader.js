let chapterModel = require('./../model/cleeArchive_fanfic'),
    tagModel = require('./../model/cleeArchive_tag'),
    tagMapModel = require('./../model/cleeArchive_tagMap'),
    userSettingModel = require('./../model/cleeArchive_userSetting');

let fs = require('fs');

let redis = require('redis'),
    redisClient = redis.createClient();

var argv = process.argv;
console.log(argv);

let readSettings = function(){

};

let calcTag = function(){
    let type = [1];
    if(argv[1] && typeof argv[3] == typeof 'test')
        type=argv[1].split(',');
    type.forEach(function(item,i,arr){
        if(typeof item != Number)
            item = Number(item);
    });
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
            case 200:
                finalProcess();
                break;
            case 505:
                break;
        }
    };

    let finalProcess = function(){
        console.log('共计'+totalNum+'条数据已完成扫描');
        console.log('开始写入');

        let writeDetailedTag = function(){
            let list = [];

            let writeDetail = function(){
                if(list.length ==0)
                {
                    console.log('全部数据写入完毕');
                    return;
                }
                let option = list.pop();
                console.log('开始写入'+unescape(option.tag));
                tagModel.findOneAndUpdate({name:unescape(option.tag)},{totalNum:option.totalNum},{new: true, upsert: true,setDefaultsOnInsert: true}).exec()
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
                        {
                            console.log(doc);
                            writeDetail();
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                        writeDetail(option);
                    });
            }

            tagDetailMap.forEach(function(value,key){
                list.push(value);
                if(list.length == tagDetailMap.size)
                    writeDetail();
            });
        };

        let writeTagUser = function(){
            let listReady = false;
            let list = [];
            let writeSettings = function(){
                if(list.length == 0)
                {
                    console.log('用户设定更新完成');
                    writeDetailedTag();
                    return;
                }
                if(list.length>0)
                {
                    let entry = list.pop();
                    if(entry.length >= 2)
                       userSettingModel.findOneAndUpdate(entry[0],entry[1],{new: true, upsert: true,setDefaultsOnInsert: true},function(err,doc){
                                if(err)
                                    console.log(err);
                                else
                                    console.log('写入成功：'+JSON.stringify(doc));
                                writeSettings();
                       });
                    else
                        continueWrite();
                }
            };

            let continueWrite = function(){
                writeSettings();
            };

            tagUser.forEach(function(value,key){
                list.push([{user:key},{usedTag:value}]);
                if(list.length == tagUser.size)
                    writeSettings();
            });
        };


        let multiRedisCommands = [];
        tagMap.forEach(function(value,key){
            multiRedisCommands.push(["set",'tag_count_'+key,value]);
        });
        redisClient.multi(multiRedisCommands).exec(function(err,replies){
            if(err)
            {
                process = 505;
                nextStep();
                return;
            }
            redisClient.keys('tag_count_*',function(err,reply){
                if(err)
                    console.log(err);
                reply.forEach(function(item,i,arr){
                   redisClient.get(item,function(err,doc){
                       if(!err)
                          console.log(item+':'+doc);
                       if(i==reply.length-1)
                       {
                           console.log('计数表更新完成');
                           writeTagUser();
                       }
                    });});
            });
        });
    };

    let nextType = function(){
        if(type.length == 0)
            process = 200;
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
                        let tempCount = tagMap.get(index);
                        let tagDetailContents = {type:subTagType,user:user,tag:index,aid:id,totalNum:tempCount};
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
    let readResult = fs.readFile(path.join(__dataModel, '../json/fanficEdit.json'), {encoding: 'utf-8'},(err,File)=>{
        if(err)
        {
           console.log(err);
        }
        else{
            let settings = JSON.parse(File);
            let redisCondition = [];
            let redisDocs = [];
            while(redisList.length>0)
            {
                let keyString = redisList.pop();
                redisCondition.push(keyString);
                redisDocs.push(JSON.stringify(settings[keyString]));
            }
            asyncRedis.mset(redisCondition, redisDocs,function(err,reply){
                if(err)
                    console.log(err);
                else
                {
                    console.log(reply);
                    console.log('对象写入完成');
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



