let chapterModel = require('./../model/cleeArchive_fanfic'),
    worksModel = require('./../model/cleeArchive_works'),
    tagModel = require('./../model/cleeArchive_tag'),
    tagMapModel = require('./../model/cleeArchive_tagMap'),
    updatesModel = require('../model/cleeArchive_postUpdates'),
    userSettingModel = require('./../model/cleeArchive_userSetting');

let fs = require('fs'),
    path = require('path');

let redis = require('redis'),
    redisClient = redis.createClient();

var argv = process.argv;
console.log(argv);

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

let initializeRecords = function(){
    chapterModel.updateMany({type:{$lt:1000}},{$set:{comments:0,liked:0,bookmarked:0}},function(err,docs){
        console.log(err);
    });
    worksModel.aggregate([
        {$lookup:{from: 'work_chapters', localField: "_id", foreignField: "book",as:"chapter"}},
        {$set:{visited:{$sum:"$chapter.visited"},liked:{$sum:"$chapter.liked"},comments:{$sum:"$chapter.comments"}}},
    ]).exec()
        .then(function(docs){
            let bulkWriteDocs = [];
            while(docs.length>0){
                let record = docs.pop();
                bulkWriteDocs.push({updateOne:{'filter':{'_id':record._id},'update':{'visited':record.visited,'comments':record.comments,'liked':record.liked}}});
            }
            return worksModel.bulkWrite(bulkWriteDocs);
        })
        .then(function(docs){
            console.log('更新写入完成');
        })
        .catch(function(err){
            console.log(err);
        });
};

let updateTagMap = function(){
    let processData = {};

    let write = function(){
        let startIndex = 0;
        let writeOne = function(){
            if(startIndex >= processData.currentRecords.length)
             {console.log(processData);return;}
            console.log(processData.currentRecords[startIndex]);
            let rec = processData.currentRecords[startIndex];
            startIndex++;
            let total = {'totalNum':rec.totalCount};
            if(processData.currentIndex != 0)
                total = { '$inc': {'totalNum':rec.totalCount}};
            tagModel.findOneAndUpdate({'name':rec._id},total,{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
                .then(function(doc){
                    if(!doc)
                        throw '没有找到该记录';
                    let list = rec.list;
                    list.forEach(function(item,i,arr){
                        list.tag = doc._id;
                    });
                    let listIndex = 0;
                    let writeTagMap = function(){
                        if(listIndex>= list.length)
                        {writeOne();return;}
                        let item = list[listIndex];
                        listIndex++;
                        if(item._id)
                            delete item._id;
                        console.log(item);
                        tagMapModel.findOneAndUpdate({tag:doc._id,infoType:item.infoType,aid:item.aid},item,{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
                            .then(function(result){
                                console.log(result);
                                writeTagMap();
                            })
                            .catch(function(err){
                                console.log(err);
                                writeTagMap();
                            });
                    }
                    writeTagMap();
                })
                .catch(function(err){
                    console.log(err);
                });
        };
        writeOne();
    };

    let proceed = function(){
        worksModel.aggregate([
            {$skip:processData.currentIndex},
            {$limit:processData.step},
            {$match:{published:true}},
            {$facet:{
                    "fanfic_chapter_fandom":[
                        {$match:{"type":{$lt:100},$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,fandom:1,user:1,date:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$fandom"},
                        {$set:{type:1,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$fandom",aid:"$_id",user:1,date:1}}
                    ],
                    "fanfic_works_fandom":[
                        {$match:{"type":{$lt:100}}},
                        {$lookup:{from:"work_index",as:"index",
                                let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                                    {$project:{chapter:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapter",localField:"index.chapter",foreignField:"_id"}},
                        {$unwind:"$chapter"},
                        {$set:{"chapter.date":"$date","chapter.updated":"$updated"}},
                        {$replaceRoot:{newRoot:"$chapter"}},
                        {$unwind:"$fandom"},
                        {$set:{type:1,infoType:0}},
                        {$project:{type:1,infoType:1,name:"$fandom",aid:"$_id",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_characters":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,characters:1,user:1,date:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$characters"},
                        {$set:{type:2,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$characters",aid:"$_id",user:1,date:1}}
                    ],
                    "fanfic_works_characters":[
                        {$match:{"type":{$lt:100},published:true}},
                        {$lookup:{from:"work_index",as:"index",
                                let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                                    {$project:{chapter:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapter",localField:"index.chapter",foreignField:"_id"}},
                        {$unwind:"$chapter"},
                        {$set:{"chapter.date":"$date","chapter.updated":"$updated"}},
                        {$replaceRoot:{newRoot:"$chapter"}},
                        {$unwind:"$characters"},
                        {$set:{type:2,infoType:0}},
                        {$project:{type:1,infoType:1,name:"$characters",aid:"$_id",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_relationships":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,relationships:1,user:1,date:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$relationships"},
                        {$set:{type:3,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$relationships",aid:"$_id",user:1,date:1}}
                    ],
                    "fanfic_works_relationships":[
                        {$match:{"type":{$lt:100},published:true}},
                        {$lookup:{from:"work_index",as:"index",
                                let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                                    {$project:{chapter:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapter",localField:"index.chapter",foreignField:"_id"}},
                        {$unwind:"$chapter"},
                        {$set:{"chapter.date":"$date","chapter.updated":"$updated"}},
                        {$replaceRoot:{newRoot:"$chapter"}},
                        {$unwind:"$relationships"},
                        {$set:{type:3,infoType:0}},
                        {$project:{type:1,infoType:1,name:"$relationships",aid:"$_id",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_tag":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,tag:1,user:1,date:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$tag"},
                        {$set:{type:4,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$tag",aid:"$_id",user:1,date:1}}
                    ],
                    "fanfic_works_tag":[
                        {$match:{"type":{$lt:100},published:true}},
                        {$lookup:{from:"work_index",as:"index",
                                let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                                    {$project:{chapter:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapter",localField:"index.chapter",foreignField:"_id"}},
                        {$unwind:"$chapter"},
                        {$set:{"chapter.date":"$date","chapter.updated":"$updated"}},
                        {$replaceRoot:{newRoot:"$chapter"}},
                        {$unwind:"$tag"},
                        {$set:{type:4,infoType:0}},
                        {$project:{type:1,infoType:1,name:"$tag",aid:"$_id",user:1,date:1,updated:1}}
                    ],
                }},
            {$project:{all:{$setUnion:["$fanfic_chapter_fandom", "$fanfic_works_fandom",
                            "$fanfic_chapter_characters","$fanfic_works_characters",
                            "$fanfic_chapter_relationships","$fanfic_works_relationships",
                            "$fanfic_chapter_tag","$fanfic_works_tag"]}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$group:{_id:"$name",totalCount:{$sum:1},list:{$push:"$$ROOT"}}}
        ]).allowDiskUse(true).exec()
            .then(function(docs){
                processData.currentRecords = docs;
                write();
            })
            .catch(function(err){
                console.log(err);
            });
    };

    let calcAll = function(){
        worksModel.countDocuments(null,function(err,response){
            if(err)
                console.log(err);
            else
               {
                   processData.all = response;
                   processData.step = 1000;
                   processData.currentIndex = 0;
                   proceed();
               }
        })
    };



            calcAll();

};

let clearTagMap = function(dataName){
    let arr = {
        tagMap:tagMapModel,
        updates:updatesModel,
    };
    if(arr[dataName])
        arr[dataName].deleteMany(null,function(err,response){
            console.log(err);
            console.log(response);
        });
    else
        console.log('请输入正确的数据库表名称');
};

let updateMessagePool = function(){
    let processData = {
        currentIndex:0,
        step:10000
    };


    let write = function(){
        let startIndex = 0;

        let writeOne = function(){
            if(startIndex >= processData.currentRecords.length)
            {
                console.log(processData);
                if(processData.currentIndex + processData.step < processData.max)
                   {
                       processData.currentIndex += processData.step;
                       proceed();
                       return;
                   }
                else
                {
                    console.log('写入完成');
                    return;
                }
            }
            let rec = processData.currentRecords[startIndex];
            startIndex++;
            updatesModel.findOneAndUpdate({publisher:rec.user,infoType:rec.infoType,contents:rec.contents},rec,{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
                .then(function(doc){
                    if(!doc)
                        throw '没有找到该记录';
                    writeOne();
                })
                .catch(function(err){
                    console.log(err);
                });
        };

        writeOne();
    };


    let proceed = function(){
        worksModel.aggregate([
            {$skip:processData.currentIndex},
            {$limit:processData.step},
            {$match:{published:true}},
            {$facet:{
                    "fanfic_chapters":[
                        {$match:{"type":{$lt:100},$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    ]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$set:{infoType:1}},
                        {$project:{infoType:1,contents:"$_id",publisher:"$user",date:1,work:"$book",_id:0}}
                    ],
                    "fanfic_works":[
                        {$match:{"type":{$lt:100}}},
                        {$lookup:{from:"work_index",as:"index",
                                let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$work","$$work_id"]},order:0}},
                                    {$project:{chapter:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapter",localField:"index.chapter",foreignField:"_id"}},
                        {$unwind:"$chapter"},
                        {$set:{infoType:0}},
                        {$project:{infoType:1,contents:"$chapter._id",publisher:"$user",date:"$date",updated:"$updated",work:"$_id",_id:0}}
                    ],
                }},
            {$project:{all:{$setUnion:["$fanfic_chapters", "$fanfic_works"]}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
        ]).allowDiskUse(true).exec()
            .then(function(docs){
                processData.currentRecords = docs;
                write();
            })
            .catch(function(err){
                console.log(err);
            });
    };


    let calcAll = function(){
        worksModel.countDocuments(null,function(err,response){
            if(err)
                console.log(err);
            else
            {
                processData.all = response;
                processData.step = 1000;
                processData.currentIndex = 0;
                proceed();
            }
        })
    };


    calcAll();
};

switch(argv[2])
{
    case 'setting':
        readSettings();
        break;
    case 'initialize':
        initializeRecords();
        break;
    case 'updateMsg':
        updateMessagePool();
        break;
    case 'updateTagMap':
        updateTagMap();
        break;
    case 'clearDataBase':
        clearTagMap(argv[3]);
        break;
    default:
        console.log('输入无效的指令');
        break;
}



