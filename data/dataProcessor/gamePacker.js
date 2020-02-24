let fs = require('fs'),
    JSZip = require('jszip'),
    fileSaver = require('file-saver'),
    crypto = require('crypto'),
    path = require('path');

let root = path.join(path.resolve(__dirname),'../../Directory/');
let dir = root;
let gameId = 'all';
gameInfoModel = require('../model/cleeGame_gameInfo');

let args = process.argv.slice(2);
if(args.length === 0)
    throw '请输入有效的路径';
console.log(args[0]);
gameInfoModel.findOne({path:args[0]}).exec()
    .then(function(doc){
        if(!doc)
            throw '请输入有效的路径名称';
        dir = root +doc._id;
        gameId = doc._id;
        resourcePacker.zipE();
    })
    .catch(function(err){
        throw err;
    });

var resourcePacker = function(){
    throw 'this is a static class';
};

resourcePacker.sign = '030102A104';
resourcePacker.ver = "000103";
resourcePacker.REMAIN = "01030804010308040103080401030804";
resourcePacker._headerlength = 16;

resourcePacker._encryptionKey = '01010000101011110';
resourcePacker._encryption = [];
resourcePacker._encrptylength = 32;

resourcePacker.initialize = function(){
    this._initialized = true;
    this._dataPack = {};
    this._maxFiles = 0;
};

resourcePacker.loadData=function(path,filename){
    if(this._encryption.length === 0)
        this.loadEncrypt();
    for(let key in this._dataPack){
        for(let i=0; i<this._dataPack[key].list.length;++i){
            let item = this._dataPack[key].list[i];
            let data = fs.readFileSync(item.path);
            item.data = data;
            item.length = data.length;
        }
    }
};

resourcePacker.readDir = function(){
    let docs = fs.readdirSync(dir);
    let zipIndex = ['data','audio','img','maps','ui','movies'];
    docs.forEach(function(file){
        let stat = fs.statSync(dir+'/'+file);
        if(stat && stat.isDirectory() && zipIndex.indexOf(file) !== -1)
        {
            let files = fs.readdirSync(dir+'\\'+file);
            if(files.length !== 0)
            {
                resourcePacker._dataPack[file] = {list:[],max:0,path:dir+'\\'+file};
                files.forEach(function(item){
                    resourcePacker._dataPack[file].list.push({data:null,path:dir+'\\'+file+'\\'+item,name:item,length:0,type:item.slice(item.lastIndexOf('.'))});
                });
                resourcePacker._maxFiles++;
            }
        }
    });
};

resourcePacker.pack = function(){
    if(!this._initialized)
        this.initialize();
    this.readDir();
    this.loadData();
    for(let key in this._dataPack)
    {
        let list = this._dataPack[key].list;
        let bufferList = [];
        let length = 0;
        for(let i =0 ;i<list.length;++i){
            length += list[i].data.length;
            bufferList.push(list[i].data);
            delete list[i].data;
        }
        let pack =  Buffer.concat(bufferList,length);
        let index = new Buffer(JSON.stringify(this._dataPack[key]));
        let encryptedIndex = this.requestEncrypt(index);
        let encryptedPack = this.requestEncrypt(pack);
        fs.writeFileSync(dir+'\\'+key+'.pck',encryptedPack);
        fs.writeFileSync(dir+'\\'+key+'.idx',encryptedIndex);
    }
};

resourcePacker.loadEncrypt = function(){
    this._encryption = this._encryptionKey.split().filter(Boolean);
};

resourcePacker.requestEncrypt = function(buffer){
    let bufferList = [];
    let ref = this.sign + this.ver + this.REMAIN;
    let refBytes = new Uint8Array(this._headerlength);
    for (let i = 0; i < this._headerlength; i++) {
        refBytes[i] = parseInt("0x" + ref.substr(i * 2, 2), 16);
    }
    if(this._encryption.length === 0)
        this.loadEncrypt();
    if (buffer) {
        for (let i = 0; i < this._encrptylength; i++) {
            let index = i%(this._encryption.length);
            buffer[i] = buffer[i]^ parseInt(this._encryption[index], 16);
        }
    }
    return Buffer.concat([refBytes,buffer],refBytes.length+buffer.length);
};

resourcePacker.cutArrayHeader = function(buffer){
    return buffer.slice(this._headerlength);
};

resourcePacker.decrypt = function(buffer){
    if (!buffer) return null;
    let header = new Uint8Array(buffer, 0, this._headerlength);

    let i;
    let ref = this.sign + this.ver + this.REMAIN;
    let refBytes = new Uint8Array(this._headerlength);
    for (i = 0; i < this._headerlength; i++) {
        refBytes[i] = parseInt("0x" + ref.substr(i * 2, 2), 16);
    }
    for (i = 0; i < this._headerlength; i++) {
        if (header[i] !== refBytes[i]) {
            throw new Error("Header is wrong");
        }
    }

    buffer = this.cutArrayHeader(buffer, resourcePacker._headerlength);
    if (buffer) {
        for (let i = 0; i < this._encrptylength; i++) {
            let index = i%(this._encryption.length);
            buffer[i] = buffer[i]^ parseInt(this._encryption[index], 16);
        }
    }
    return buffer;
};


resourcePacker.zip = function(){
    let zip = new JSZip();
    let docs = fs.readdirSync(dir);
    let compressed = [];
    for(let i=0;i<docs.length;++i){
        let filename = docs[i];
        if(filename.indexOf('.pck') !== -1 || filename.indexOf('.idx') !== -1)
        {
            let data = fs.readFileSync(dir+'/'+filename);
            compressed.push(dir+'/'+filename);
            zip.file(filename,data,{binary:true});
        }
    };

    zip.generateAsync({type:"uint8array",compression:"DEFLATE",compressionOptions:{level: 9}})
        .then(function(content){
            fs.writeFile(dir+'/'+gameId+'.zip',content,function(err,doc){
                if(err)
                    console.log(err);
                else
                {
                    compressed.forEach(function(item){
                        let result = fs.unlinkSync(item);
                    });
                    let md5 = crypto.createHash('md5');
                    let code = md5.update(content).digest('hex').toString();
                    gameInfoModel.findOneAndUpdate({_id:gameId},{md5:code},function(err,result){
                        if(err)
                            console.log(err);
                        else
                            console.log('更新成功');
                    });
                }

            });
        })
};

resourcePacker.zipE = function(){
    if(!this._initialized)
        this.initialize();
    this.pack();
    this.zip();
};