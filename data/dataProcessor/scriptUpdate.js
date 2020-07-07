var path = require('path');
var fs = require('fs');

var __dataModel = path.join(path.resolve(__dirname),'../model');

var settingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));


//更新用户注册下的access格式
var createNewAuthor = function(access){
	if(access.length ===0 )
		return null;
	let newArr = [];
	for(let i=0;i<access.length;++i){
		if(access[i] && typeof access[i] === 'number')
			newArr.push({index:access[i],requested:Date.now(),joined:Date.now()});
	}
	if(newArr.length === 0)
		return null;
	return newArr;
};

var updateAccess = function(){
	var id = 'userSetting.Access';
	settingModel.find({},function(err,docs){
		let bulkWriteDocs = [];
		for(let i=0; i< docs.length;++i){
			let doc = docs[i];
			let oldAccess = doc.access || [];
			let newAccess = createNewAuthor(doc.access);
			if(newAccess) {
				let newUpdate = {updateOne: {
					'filter': {'_id': doc._id},
						'update':{$set: {access:[]}}
				}};
				let newPush = {updateOne: {
						'filter': {'_id': doc._id},
						'update':{$push:{access:{$each:newAccess}}}
				}};
				bulkWriteDocs.push(newUpdate);
				bulkWriteDocs.push(newPush);
			}
		}
		if(bulkWriteDocs.length>=0)
			settingModel.bulkWrite(bulkWriteDocs,function(err,result){
				if(err)
					console.log(err);
				else
					console.log(result);
			});
	}).lean();
};

updateAccess();