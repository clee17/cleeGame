let fs = require('fs'),
    JSZip = require('jszip'),
    fileSaver = require('file-saver'),
    path = require('path');

let root = path.join(path.resolve(__dirname),'../../Directory/');
let dir = root;
gameInfoModel = require('../model/cleeGame_gameInfo');

let args = process.argv.slice(2);
if(args.length === 0)
    throw '请输入有效的路径';

gameInfoModel.findOne({path:args[0]}).exec()
    .then(function(doc){
        if(!doc)
            throw '请输入有效的路径名称';
        dir = root +doc._id;
        resourceUnpacker.unzip();
    })
    .catch(function(err){
        throw err;
    });

var resourceUnpacker = function(){
    throw 'this is a static class';
};

resourceUnpacker.sign = '030102A104';
resourceUnpacker.ver = "000103";
resourceUnpacker.REMAIN = "01030804010308040103080401030804";
resourceUnpacker._headerlength = 16;

resourceUnpacker._encryptionKey = '01010000101011110';
resourceUnpacker._encryption = [];
resourceUnpacker._encrptylength = 32;

resourceUnpacker.initialize = function(){
    this._initialized = true;
    this._dataPack = {};
    this._maxFiles = 0;
};

resourceUnpacker.loadEncrypt = function(){
    this._encryption = this._encryptionKey.split().filter(Boolean);
};

resourceUnpacker.cutArrayHeader = function(buffer){
    return buffer.slice(this._headerlength);
};

resourceUnpacker.decrypt = function(buffer){
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

    buffer = this.cutArrayHeader(buffer, resourceUnpacker._headerlength);
    if (buffer) {
        for (let i = 0; i < this._encrptylength; i++) {
            let index = i%(this._encryption.length);
            buffer[i] = buffer[i]^ parseInt(this._encryption[index], 16);
        }
    }
    return buffer;
};


resourceUnpacker.unzip = function(){
    let data = fs.readFileSync(dir+'/all.zip');
    if(!data)
        throw '请先打包';
    let zip = new JSZip();
   zip.loadAsync(data)
        .then(function(contents){
            for(let key in contents.files){
                zip.file(key).async('nodeBuffer')
                    .then(function(content) {
                        if(key.indexOf('.idx'!== -1))
                        {
                             let data = resourceUnpacker.decrypt(content);
                             console.log(JSON.parse(data));
                        }
                    });
            }
        })
        .catch(function(err){
            throw err;
        });
};