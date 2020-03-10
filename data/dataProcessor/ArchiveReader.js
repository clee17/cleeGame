let fs = require('fs'),
    path = require('path'),
    LZString = require('../../js/lib/lz-string1.4.4');

let chapterModel = require('./../model/cleeArchive_fanfic'),
    worksModel = require('./../model/cleeArchive_works'),
    indexModel = require('./../model/cleeArchive_workIndex'),
    likeModel = require('./../model/cleeArchive_postLike'),
    tagModel = require('./../model/cleeArchive_tag'),
    tagMapModel = require('./../model/cleeArchive_tagMap'),
    updatesModel = require('../model/cleeArchive_postUpdates'),
    countMapModel = require('../model/cleeArchive_countMap'),
    userModel = require('../model/user'),
    userSettingModel = require('./../model/cleeArchive_userSetting');


let redis = require('redis'),
    redisClient = redis.createClient();

var argv = process.argv;
console.log(argv);

function dataEditor(){
    throw new Error(' this is a static class');
}

dataEditor.initialize = function(){
    this._processing = false;
    this._likes = [];
};

dataEditor.getAllLikes = function(works,callback){
    likeModel.find({work:{$in:works}},function(err,docs) {
        if(err)
            console.log(err);
        else
        {
            dataEditor.likes = JSON.parse(JSON.stringify(docs));
            if(callback)
                callback(true);
        }
    });
};

dataEditor.mergeFanfic = function(doc){
    if(doc.contents.length <=2)
    {
        console.log('没有收到复数的章节');
        return;
    }
    let data = {
        index:0
    };

        let processIndex = function(){
            let bulkWriteDocs = [];
            for(let i = 0;i<rootIndex[i].length;++i){
                rootIndex[i].next = i+1>=rootIndex.length? null : rootIndex[i+1];
                rootIndex[i].prev = i-1>=0? rootIndex[i-1] : null;
                rootIndex[i].work = works[0];
                let update = JSON.parse(JSON.stringify(rootIndex[i]));
                delete update._id;
                bulkWriteDocs.push({updateOne:{'filter':{'_id':rootIndex[i]._id},'update':update}});
                indexModel.bulkWrite(bulkWriteDocs,function(err,docs){
                    if(!err)
                        processLike();
                });
            }
        };
        let readIndex = function(data){
            if(!data.index >= works.length)
            {
                processIndex();
            }
            indexModel.find({work:works[data.index]},function(err,docs){
                rootIndex.concat(docs);
                data.index++;
                readIndex(data);
            })
        };

        readIndex(data);
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

    let checkFinal = function(){
        if(processData.currentIndex + processData.step < processData.all)
        {
            processData.currentIndex += processData.step;
            proceed();
        }
        else
            console.log('写入Tag表完成');
    };

    let processDuplicate = function(){
        for (let i = 0; i< processData.currentRecords.length;++i){
			if(!processData.currentRecords[i])
				continue;
            let name = processData.currentRecords[i].name = processData.currentRecords[i]._id.toLowerCase();
            let searchName = processData.currentRecords[i].searchName = escape(name);
            for (let j=0;j<processData.currentRecords.length;++j){
                let item = processData.currentRecords[j];
                if(item && escape(item._id.toLowerCase()) === searchName && j!= i){
                    processData.currentRecords[i].workCount += item.workCount;
                    processData.currentRecords[i].totalCount += item.totalCount;
					console.log(processData.currentRecords[i].searchName);
					console.log(processData.currentRecords[i].workCount);
					console.log(processData.currentRecords[i].totalCount);
                    processData.currentRecords[i].list = processData.currentRecords[i].list.concat(processData.currentRecords[j].list);
                    processData.currentRecords[j] =null;
                }
            }
        }

        while (processData.currentRecords.indexOf(null) >=0){
            let index = processData.currentRecords.indexOf(null);
            processData.currentRecords.splice(index,1);
        }
    };

    let write = function(){
        let startIndex = 0;
        let writeOne = function(){
            if(startIndex >= processData.currentRecords.length)
            {
               checkFinal();
               return;
            }
            let rec = processData.currentRecords[startIndex];
            startIndex++;
            let update = { '$inc': {'totalNum':rec.totalCount,'workNum':rec.workCount},name:rec.name};
            tagModel.findOneAndUpdate({'searchName':rec.searchName},update,{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
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
                        tagMapModel.findOneAndUpdate({tag:doc._id,infoType:item.infoType,aid:item.aid},item,{new:true,upsert:true,setDefaultsOnInsert: true}).exec()
                            .then(function(result){
                                writeTagMap();
                            })
                            .catch(function(err){
                                writeTagMap();
                            });
                    };
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
                                    {$project:{_id:1,fandom:1,user:1,date:1,book:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$fandom"},
                        {$set:{type:1,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$fandom",aid:"$_id",work:"$book",user:1,date:1}}
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
                        {$project:{type:1,infoType:1,name:"$fandom",aid:"$_id",work:"$book",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_characters":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,characters:1,user:1,date:1,book:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$characters"},
                        {$set:{type:2,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$characters",aid:"$_id",work:"$book",user:1,date:1}}
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
                        {$project:{type:1,infoType:1,name:"$characters",aid:"$_id",work:"$book",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_relationships":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,relationships:1,user:1,date:1,book:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$relationships"},
                        {$set:{type:3,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$relationships",aid:"$_id",work:"$book",user:1,date:1}}
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
                        {$project:{type:1,infoType:1,name:"$relationships",aid:"$_id",work:"$book",user:1,date:1,updated:1}}
                    ],
                    "fanfic_chapter_tag":[
                        {$match:{"type":{$lt:100},published:true,$or:[{"status":1},{"chapterCount":{$gt:1}}]}},
                        {$lookup:{from:"work_chapters",as:"chapters", let:{work_id:"$_id"},
                                pipeline:[
                                    {$match:{$expr:{$eq:["$book","$$work_id"]},published:true}},
                                    {$project:{_id:1,tag:1,user:1,date:1,book:1}}]}},
                        {$unwind:"$chapters"},
                        {$replaceRoot:{newRoot:"$chapters"}},
                        {$unwind:"$tag"},
                        {$set:{type:4,infoType:1}},
                        {$project:{type:1,infoType:1,name:"$tag",aid:"$_id",work:"$book",user:1,date:1}}
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
                        {$project:{type:1,infoType:1,name:"$tag",aid:"$_id",work:"$book",user:1,date:1,updated:1}}
                    ],
                }},
            {$project:{all:{$setUnion:["$fanfic_chapter_fandom", "$fanfic_works_fandom",
                            "$fanfic_chapter_characters","$fanfic_works_characters",
                            "$fanfic_chapter_relationships","$fanfic_works_relationships",
                            "$fanfic_chapter_tag","$fanfic_works_tag"]}}},
            {$unwind:"$all"},
            {$replaceRoot:{newRoot:"$all"}},
            {$group:{_id:"$name",totalCount:{$sum:1},workCount:{$sum: { "$cond": [{ "$eq": ["$infoType", 0] }, 1, 0] }},list:{$push:"$$ROOT"}}}
        ]).allowDiskUse(true).exec()
            .then(function(docs){
                processData.currentRecords = docs;
                processDuplicate();
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
        tag:tagModel,
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

let countAllUser = function(){
       userModel.countDocuments({},function(err,result){
            countMapModel.findOneAndUpdate({infoType:100},{number:result},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,docs){
                if(err)
                    console.log(err);
                else
                    console.log('共有全部创作者'+docs.number+'人');
            });
       });

    userSettingModel.countDocuments({access:101},function(err,result){
        countMapModel.findOneAndUpdate({infoType:101},{number:result},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,docs){
            if(err)
                console.log(err);
            else
                console.log('共有文章创作者'+docs.number+'人');
        });
    });

    userSettingModel.countDocuments({access:102},function(err,result){
        countMapModel.findOneAndUpdate({infoType:102},{number:result},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,docs){
            if(err)
                console.log(err);
            else
                console.log('共有绘图创作者'+docs.number+'人');
        });
    });

    userSettingModel.countDocuments({access:103},function(err,result){
        countMapModel.findOneAndUpdate({infoType:103},{number:result},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,docs){
            if(err)
                console.log(err);
            else
                console.log('共有同人游戏创作者'+docs.number+'人');
        });
    });
};

let countAll = function(){
    let countMap = [{infoType:0,number:0},{infoType:1,number:0},{infoType:5,number:0}];
    let startIndex = 0;
    let maxIndex = 0;
    let final = function(){
        if(startIndex < countMap.length)
            return;
        maxIndex = startIndex;
        countMap.forEach(function(item){
            countMapModel.findOneAndUpdate({infoType:item.infoType},{number:item.number},{new:true,upsert:true,setDefaultsOnInsert: true},function(err,doc){
                maxIndex --;
                if(maxIndex === 0)
                    console.log('写入完成');
            });
        })
    };

    worksModel.countDocuments({published:true,type:0},function(err,count){
        if(!err)
        {
            countMap.forEach(function(item,i,arr){
                if(item.infoType === 0)
                     countMap[i].number = count;
            })
        }
        startIndex++;
        final();
    });

    worksModel.countDocuments({published:true,type:0,chapterCount:1,status:0},function(err,count){
        if(!err)
        {
            countMap.forEach(function(item,i,arr){
                if(item.infoType === 5)
                    countMap[i].number = count;
            })
        }
        startIndex++;
        final();
    });

    chapterModel.countDocuments({type:{$lte:100},published:true},function(err,count){
        if(!err)
        {
            countMap.forEach(function(item,i,arr){
                if(item.infoType === 1)
                    countMap[i].number = count;
            })
        }
        startIndex++;
        final();
    });

};

let tidyChapter = function(){
   chapterModel.find({},{contents:0}).exec()
       .then(function(docs){
           docs.forEach(function(item){
               indexModel.find({chapter:item._id},function(err,docs){
                   if(docs.length === 0)
                       chapterModel.deleteOne({_id:item._id},function(err,doc){
                           if(!err)
                               console.log(item._id+'deleted');
                       })
               })
           })
       })
       .catch(function(err){
           console.log(err);
       })
};


let chapterCount = function(){
    worksModel.find({},function(err,docs){
        docs.forEach(function(item){
            chapterModel.countDocuments({published:true,book:item._id},function(err,count){
                worksModel.findOneAndUpdate({_id:item._id},{chapterCount:count},{new:true},function(err,doc){
                    console.log(doc._id+'章节更新为'+doc.chapterCount);
                });
            })
        })
    })
};

let fixUser = function(){
    worksModel.find({},function(err,docs){
        docs.forEach(function(item){
            let infoFilter = [0,1];
            updatesModel.update({infoType:{$in:infoFilter},work:item._id},{publisher:item.user},function(err,doc){
                 if(err)
                     console.log(item._id+'更新表格更新用户错误');
            });
            chapterModel.update({book:item._id},{user:item.user},function(err,count){
                console.log(item._id +'更新作者完成');
            })
        })
    });
};

let changeChapterId = function(prevId, nextId){
    if(!prevId)
        console.log('请输入更改前的ID');
    if(!nextId)
        console.log('请输入更改后的ID');

    console.log(typeof prevId);
    tagMapModel.findOneAndUpdate({contents:prevId},{contents:nextId},function(err,doc){
        if(doc)
            console.log(prevId+'已经被更改为'+nextId);
        else
            console.log('标签表'+err);
    });

    indexModel.findOneAndUpdate({chapter:prevId},{chapter:nextId},function(err,doc){
        if(doc)
            console.log('目录表'+prevId+'已经被更改为'+nextId);
        else
            console.log('目录表'+err);
    });

    updatesModel.findOneAndUpdate({contents:prevId},{contents:nextId},function(err,doc){
        if(doc)
            console.log('信息表'+prevId+'已经被更改为'+nextId);
        else
            console.log('信息表'+err);
    });
};

let compressAllNovel = function(){
    chapterModel.find({},{contents:1,_id:1},function(err,docs){
        let maxLength = docs.length;
        let startIndex = 0;
        for(let i =0; i<docs.length;++i){
            docs[i].contents = LZString.compressToBase64(docs[i].contents);
            chapterModel.findOneAndUpdate({_id:docs[i]._id},{contents:docs[i].contents},function(err,doc){
                if(err)
                    console.log(err);
                startIndex++;
                if(startIndex >= maxLength)
                    console.log('打包完成');
            });
        }
    });
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
    case 'countAll':
        countAll();
        break;
    case 'tidyChapter':
        tidyChapter();
        break;
    case 'chapterCount':
        chapterCount();
        break;
    case 'fixUser':
        fixUser();
        break;
    case 'changeChapter':
        changeChapterId(argv[3],argv[4]);
        break;
    // case 'mergeWork':
        // mergeWork([argv[3],argv[4]]);
        // break;
    case 'countUser':
        countAllUser();
        break;
    case 'compressContents':
        compressAllNovel();
        break;
    default:
        console.log('输入无效的指令');
        break;
}



