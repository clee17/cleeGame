var path = require('path');
var fs = require('fs');

var __dataModel = path.join(path.resolve(__dirname),'../model');
var __basedir = path.join(path.resolve(__dirname),'../../');

var lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));
var settingModel = require(path.join(__dataModel,'cleeArchive_userSetting'));
var userModel = require(path.join(__dataModel,'user'));
let applicationModel = require(path.join(__dataModel,'application'));
let registerModel = require(path.join(__dataModel,'user_register'));

//更新用户注册下的access格式
var createNewAuthor = function(access){
	if(access.length ===0 )
		return null;
	let newArr = [];
	for(let i=0;i<access.length;++i){
		if(access[i] && typeof access[i] === 'number')
			newArr.push({index:access[i],requested:Date.now(),joined:Date.now()});
		else if(access[i])
			newArr.push(access[i]);
	}
	if(newArr.length === 0)
		return null;
	return newArr;
};

var updateAccess = function(){
	var id = 'userSetting.Access';
	settingModel.find({},function(err,docs){
		for(let i =0;i <docs.length;++i){
			settingModel.findOneAndUpdate({_id:docs[i]._id},{role:1}).exec()
				.then(function(){
					return settingModel.update({_id:docs[i]._id},{$unset:{access:""}}).exec();
				})
				.then(function(result){
					console.log (docs[i]._id +' access reset success');
				})
		}
	}).lean();
};

var updateUserRegister = function(){
	userModel.find({},function(err,result){
		if(err)
			console.log(err);
		 for(let i= 0; i<result.length;++i){
		 	let user = result[i];
		 	if(user && user.mail && user.mail.length >0){
				registerModel.findOneAndUpdate({mail:user.mail},{user:user._id,mail:user.mail,intro:user.intro},{upsert:true,new:true,setDefaultsOnInsert:true}).exec()
					.then(function(register) {
						return userModel.findOneAndUpdate({_id: user._id}, {register: register._id}).exec();
					})
						.then(function(userInfo){
							return userModel.findOneAndUpdate({_id:userInfo._id}, {$unset:{mail:"",intro:"",userGroup:""}},{new:true}).exec();
						})
				    	.then(function(result){
				    		console.log(result);
					    })
						.catch(function(err){
							console.log(err);
						})
			}else{
				userModel.findOneAndUpdate({_id:result[i]._id}, {$unset:{mail:"",intro:"",userGroup:""}},{new:true},function(err,result){
					 console.log('success');
				});
			}
		 }
	});
}

var updateApplicationAndRegister = function(docs){
	for(let i=0; i<docs.length;++i){
		let doc = docs[i];
		if(!doc.mail)
			continue;
		registerModel.findOneAndUpdate({mail:doc.mail},{},{new:true,setDefaultsOnInsert:true,upsert:true}).exec()
			.then(function(register){
				if(register)
					return applicationModel.findOneAndUpdate({_id:doc._id},{register:register._id},{new:true}).exec();
				else console.log('no register found for the mail'+doc.mail);
			})
			.then(function(application){
				return applicationModel.update({_id:application._id},{$unset:{mail:"",user:"",subType:"",count:"",response:"",status:""}}).exec();
			})
			.then(function(result){
			})
			.catch(function(err){
				console.log(err);
			})
	}
}

var clearApplicationModel = function(){
	applicationModel.find({type:{$gt:0}}).exec()
		.then(function(results){
			for(let i=0;i<results.length;++i){
				let statements = lzString.compressToBase64(results[i].statements);
				applicationModel.findOneAndUpdate({_id:results[i]._id},{statements:statements},function(err,doc){
					let mail = doc.register? doc.register.mail : doc.mail;
					if(err)
						console.log(err);
				}).populate('register');
			}
			return applicationModel.update({subType:9999},{result:0},{multi:true}).exec();
		})
		.then(function(result){
			return applicationModel.update({subType: {$lt:9999}},{result:1},{multi:true}).exec();
		})
		.then(function(result){
			return applicationModel.find({
				mail: {$nin: [undefined,'']}
			}).exec();
		})
		.then(function(docs){
			updateApplicationAndRegister(docs);
			return applicationModel.find({
				mail: {$in: [undefined,'']},
				user:{$nin:[undefined,null]}
			}).populate({ path:'user', populate: { path:  'register', model: 'user_register' }}).exec();
		})
		.then(function(docs){
			for(let i=0; i<docs.length;++i){
				docs[i].mail = docs[i].user.register? docs[i].user.register.mail:null;
				if(!docs[i].mail){
					console.log(docs[i].user.user + ' has not linked to register');
				}
			}
			updateApplicationAndRegister(docs);
		})
		.catch(function(err){
			console.log(err);
		})
}

updateAccess();
updateUserRegister();
clearApplicationModel();

