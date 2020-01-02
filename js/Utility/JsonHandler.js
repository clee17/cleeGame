var path = require('path'),
    fs = require('fs'),
    encoder = require('./encoder');

function JsonHandle(fileDir,fileList){
    this.dir = path.join(__basedir,fileDir); //'/memoria/data/'
    this._dataSrcs = [];
    this.cacheMap = {};
    if(fileList != null) {
        for (var i = 0; i < fileList.length; ++i)
        {
            this._dataSrcs.push(fileList[i]);
        }
    }
    this.initDataBase();
}

JsonHandle.prototype.constructor = JsonHandle;

JsonHandle.prototype.initDataBase = function(){
    console.log('entered database initiation');
    for(var i=0; i<this._dataSrcs.length; ++i){
        this.readJson(this._dataSrcs[i]);
        if(this.cacheMap[this._dataSrcs[i]] == null)
            this.cacheMap[this._dataSrcs[i]] = {'data':[],'total':0,'maxId':0};
    }
};

JsonHandle.prototype.readJson = async function(filename){
    let fullPath = this.dir+filename+'.json';
    let uncodePath = this.dir+filename+'Ex.json';
    let noEncode = fs.existsSync(uncodePath);
    let ifExist = fs.existsSync(fullPath);
    if(!ifExist && noEncode)
        fullPath = uncodePath;
    let data = fs.readFileSync(fullPath);
    if(data != null)
    {
        if(ifExist) {
            data = encoder.decode(data.toString());
        }
        data = JSON.parse(data);
        data.lastModified = Date.now();
        if(this.cacheMap[filename]!=null)
            data.lastSaved = this.cacheMap[filename].lastSaved;
        else
            data.lastSaved = data.lastModified +1;
        data['cleegame.js']= filename;
        this.cacheMap[filename] = data;
    }
};

JsonHandle.prototype.writeJson = function (filename){
    let data   = this.cacheMap[filename];
    if(data != null)
    {
        data.lastSaved = Date.now();
    }
    else
    {
        cosole.log('no database '+filename+'existed');
        return;
    }

    data = encoder.encode(JSON.stringify(data));
    let fullPath = this.dir+filename+'.json';
    fs.writeFile(fullPath,data,function(err){
        if(err)
        {
            console.log('JsonHandle error:'+filename+'write failed');
        }
    });
};

JsonHandle.prototype.reindex = function(filename){
    if(cacheMap[filename] == null)
        readJson(filename);
    if(cacheMap[filename] == null)
        return;
    let data = cacheMap[filename].data;
    var index = 0;
    for(; index<data.length;++index)
    {
        data.id = index+1;
    }
    cacheMap[filename].total = data.length;
};

JsonHandle.prototype.deleteEntry = function(filename,id){
    if(cacheMap[filename] == null)
        readJson(filename);
    if(cacheMap[filename] == null)
        return;
    let data = cacheMap[filename].data;
    for(var i=0; i<data.length;++i)
    {
        if(data[i].id == id)
        {
            data.splice(i,1);
        }
    }
};

JsonHandle.prototype.addEntry = function(filename,record,index){
    if(cacheMap[filename] == null)
        readJson(filename);
    if(cacheMap[filename] == null)
        return;
    let data = cacheMap[filename].data;
    record.id = cacheMap[filename].maxId++;
    if(index != null)
        data.splice(index,0,record);
    else
        data.push(record);

    record.id = data[data.length-1].id+1;
    data.push(record);
};

JsonHandle.prototype.editEntry = function(record,filename,index){
  if(cacheMap[filename] == null)
      readJson(filename);
  if(cacheMap[filename] == null)
      return;
  let data = cacheMap[filename].data[index];
  for(var key in data)
  {
      if(data[key] != record[key] && record[key] != null)
          data[key] = record[key];
  }
};

JsonHandle.prototype.getEntry = function(index,filename){
    if(this.cacheMap[filename] == null)
        readJson(filename);
    if(this.cacheMap[filename] == null)
        return null;
    return this.cacheMap[filename].data[index];
};

JsonHandle.prototype.getDataBase = function(filename){
    if(this.cacheMap[filename] == null)
        readJson(filename);
    if(this.cacheMap[fielname] == null)
        return null;
    let sample = {};
    sample.data = this.cacheMap[filename].data;
    sample.name = this.cacheMap[filename].cleegame;
    return sample;
}

module.exports = JsonHandle;