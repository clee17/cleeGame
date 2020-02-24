function loader() {
    throw new Error('This is a static class');
}

loader.initialize = function() {
    if(this._initialized)
        return;
    this._initialized = true;
    this._request = null;
    this._status = 'validating';
    this._files = {};
    this._dataPack = {};
    this._raw = null;
    this._extracted = false;
    this._localEnabled = false;
    this._downloadProgress = 0;
    this._extractProgress = 0;
    this._extracted = false;
    this._isLoaded = false;

    this._infoMatch = {
        version:false,
        md5:false
    };
    this._validated = 0;
    this.__encryption = [];
    this._localSaved = 0;
    this._db = null;
    this._err = [];

    this.checkIndexedDB();
};

loader.checkIndexedDB = function(){
    if(!window.indexedDB)
    {
        this._err.push('您的计算不支持本地数据库，将从云端获取数据');
        loader.request();
        return;
    }

    let request =  window.indexedDB.open(id,1.1);

    request.onerror = function(event){
        loader._err.push('该电脑打开本地数据库失败，将从云端获取数据');
        loader.request();
    };

    request.onsuccess = function(event){
        loader._db = request.result;
        loader.validate();
        loader._localEnabled = true;
    };

    request.onupgradeneeded = function(event){
        loader._db = request.result;
        loader._localEnabled = true;
        if(!loader._db.objectStoreNames.contains('data') || !loader._db.objectStoreNames.contains('Scene') ){
            let data = loader._db.createObjectStore('data',{keyPath:'name'});
            loader._db.createObjectStore('img',{keyPath:'name'});
            loader._db.createObjectStore('Scene',{keyPath:'name'});
            loader._db.createObjectStore('info',{keyPath:'name'});
            loader.request();
        }else loader.validate();

    }
};

loader.validate = function(){
    loader.checkInfo('md5',Md5Info);
    loader.checkInfo('version',version);
};

loader.checkInfo = function(infoName,target){
    let request = loader._db.transaction(['info'])
        .objectStore('info')
        .get(infoName);
    request.onerror = function(event){
        loader.finishValidate();
    };
    request.onsuccess = function(event){
        loader._infoMatch[infoName] = (request.result && request.result.val === target);
        loader.finishValidate();
    };
};

loader.checkRequestNeeded = function(){
    let result = true;
    for(let key in this._infoMatch)
        result = this._infoMatch[key] ?  result:false;
    return !result;
};

loader.finishValidate = function(){
    this._validated++;
    if(this._validated>= Object.getOwnPropertyNames(this._infoMatch).length){
        if(this.checkRequestNeeded())
            this.request();
        else
            this.finishRequest();
    }
};

loader.finishRequest = function(){
    this._downloadProgress = 100;
    this._extractProgress = 100;
    this._extracted = true;
    this._isLoaded = true;
};

loader.loadDatabaseFiles = function(docs){
     if(!docs)
         return;
     this._dataPack.data = [];
     for(let i=0;i<docs.length;++i){
         let record = {content:docs[i].content,name:docs[i].name,loaded:false};
         this._dataPack.data.push(record);
     }
};

loader.getDataFiles = function(callback){
    if(this._dataPack.data)
    {
        if(callback)
            callback(this._dataPack.data);
    }
    else if(this._db) {
        let transaction = this._db.transaction('data','readonly').objectStore('data').getAll();
        transaction.onsuccess = function(){
                loader.loadDatabaseFiles(transaction.result);
                if(callback)
                    callback(loader._dataPack.data);
        };
        transaction.onerror = function(){
                 if(callback)
                     callback([]);
        };
    }
};

loader.loadSystemInfo = function(docs){
    if(!docs)
        return;
    this._dataPack.system = [];
    for(let i=0;i<docs.length;++i){
        let record = {content:docs[i].content,name:docs[i].name,loaded:false};
        this._dataPack.data.system(record);
    }
};

loader.clearCache = function(key){
    if(this._dataPack[key])
        this._dataPack[key] = null;

};

loader.getSystemInfo = function(callback){
    if(this._dataPack.system)
        if(callback)
            callback(this._dataPack.system);
    else if(this._db){
            let transaction = this._db.transaction('info','readonly').objectStore('info').getAll();
            transaction.onsuccess = function(){
                loader.loadSystemInfo(transaction.result);
                if(callback)
                    callback(loader._dataPack.system);
            };
            transaction.onerror = function(){
                if(callback)
                    callback([]);
            };
    }
};

loader.getProgress = function(){
     return (this._downloadProgress/100 * 80 + this._extractProgress/100 *20);
};

loader._onDownloadProgress = function(event){
    if(event.lengthComputable)
        this._downloadProgress = event.loaded/event.total * 100;
};

loader.request = function(){
    if(this._status !== 'validating')
        return;
    this._status = 'requesting';
    let newUrl= '/games/request?id='+id;
    let requestFile = this._request = new XMLHttpRequest();
    requestFile.open("GET", newUrl);
    requestFile.responseType = "arraybuffer";
    requestFile.send();
    requestFile.addEventListener('progress',this._onDownloadProgress.bind(this));
    requestFile.onload = function () {
        if(requestFile.response && requestFile.status <= 400)
        {
            loader._requested = true;
            this._request = null;
            loader.receiveData(requestFile.response);
        }
    };
};

loader.sign = '030102A104';
loader.ver = "000103";
loader.REMAIN = "01030804010308040103080401030804";
loader._headerlength = 16;

loader._encryptionKey = '01010000101011110';
loader._encryption = [];
loader._encrptylength = 32;

loader.loadEncrypt = function(){
    this._encryption = this._encryptionKey.split().filter(Boolean);
};

loader.receiveData = function(data){
    this._raw =  data;
    updateManager.registerUpdate(loader);
};

loader.cutArrayHeader = function(buffer){
    return buffer.slice(this._headerlength);
};


loader.decrypt = function(buffer){
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


    buffer = this.cutArrayHeader(buffer, this._headerlength);
    let view = new DataView(buffer);
    if(this._encryption.length === 0)
        this.loadEncrypt();
    if (buffer) {
        let byteArray = new Uint8Array(buffer);
        for (i = 0; i < this._encrptylength; i++) {
            let index = i%(this._encryption.length);
            byteArray[i] = byteArray[i] ^ parseInt(this._encryption[index], 16);
            view.setUint8(i, byteArray[i]);
        }
    }
    return buffer;
};

loader.readBinaryString = function(buffer,callback){
    let blob=new Blob([buffer]);
    let reader = new FileReader();
    reader.addEventListener("loadend", function(){
        callback(reader.result);
    });
    reader.readAsBinaryString(blob);
};

loader.readText = function(buffer,callback){
    let blob=new Blob([buffer]);
    let reader = new FileReader();
    reader.addEventListener("loadend", function(){
        callback(reader.result);
    });
    reader.readAsText(blob);
};

loader.checkFullyCached = function(){
    if(loader._localSaved >= Object.getOwnPropertyNames(loader._files).length)
     {
         for(let key in this._files)
         {
             if(this._files[key].failed > 0)
                 return;
         }
         loader._db.transaction('info','readwrite').objectStore('info').put({name:'version',type:'String',val:version});
         loader._db.transaction('info','readwrite').objectStore('info').put({name:'md5',type:'String',val:Md5Info});
         this._isLoaded = true;
         this._extractProgress = 100;
     }
};

loader.loadAllScene = function(){
    let scene = this._files['Scene'];
    this.readBinaryString(scene.pck,function(result){
        loader._sceneHTML = result;
    });
};

loader._onRecordUpdated = function(list,event) {
    let key = list.sub;
    if (key === 'info')
        return;
    if(event.type === "success")
       loader._files[key].saved++;
    else
    {
        loader._files[key].failed++;
        if(!loader._dataPack[key])
           loader._dataPack[key] = {};
        loader._dataPack[key][list.name] = list;
        list.referred = null;
    }
    console.log(loader._files[key]);
    if(loader._files[key].saved + loader._files[key].failed >= loader._files[key].idx.list.length)
    {
        loader._localSaved++;
        loader._files[key].pck = null;
        this._extractProgress+= this._localSaved/Object.getOwnPropertyNames(this._files).length * 100;
        loader.checkFullyCached();
    }
};

loader.updateRecords = function(key){
    let startIndex = 0;
    let list = loader._files[key].idx.list;
    for(let i=0; i<list.length;++i){
        let content = loader._files[key].pck.slice(startIndex,startIndex+list[i].length);
        delete list[i].path;
        list[i].index = i;
        startIndex += list[i].length;
        list[i].content = content;
        list[i].sub  = key;

        if(list[i].type === '.json')
        {
            this.readBinaryString(list[i].content,function(result){
                let meta = JSON.parse(result);
                let frames = meta.frames;
                let request = loader._db.transaction(key,'readwrite').objectStore(key);
                for(let key in frames)
                {
                    let list = frames[key];
                    list.name = key;
                    list.alias = meta.meta.image;
                    request.put(list);
                }
                loader._files[key].saved++;
            });
        }
        else{
            let request = loader._db.transaction(key,'readwrite').objectStore(key).put(list[i]);
            request.onsuccess = this._onRecordUpdated.bind(this,list[i]);
            request.onerror = this._onRecordUpdated.bind(this,list[i]);
        }

    }
};

loader.saveToDB = function(key){
    let data = this._files[key];
    this.readBinaryString(data.idx,function(result){
        loader._files[key].idx = JSON.parse(result);
        loader.updateRecords(key);
    });
};

loader.saveAllToDB = function(buffer,key,callback){
    this._localSaved = 0;
    for(let key in this._files)
    {
        if(key === 'Scene')
            loader.loadAllScene();
        else
            loader.saveToDB(key);
    }
};

loader.extractFiles = function(){
    for(let key in loader._files){
        let index = this._files[key].idx;
        this._files[key].idx = this.decrypt(index);
        let pack = this._files[key].pck;
        this._files[key].pck = this.decrypt(pack);
        this._files[key].saved = 0;
        this._files[key].failed = 0;

    }
    if(this._localEnabled)
    {
        this._extractProgress = 50;
        this.saveAllToDB();
    }
    else
        this._extractProgress = 100;
};

loader.unzip = function(){
       let zip = new JSZip();
        zip.loadAsync(loader._raw).then(function(contents){
            this._raw = null;
            let count = 0;
            for(let key in contents.files){
                zip.file(key).async('arraybuffer')
                    .then(function(content) {
                        let name = key.slice(0,key.lastIndexOf('.'));
                        let type = key.slice(key.lastIndexOf('.')+1);
                       if(!loader._files[name])
                           loader._files[name] = {};
                       loader._files[name][type] = content;
                       count++;
                       if(count >= Object.getOwnPropertyNames(contents.files).length)
                           loader.extractFiles();
                    })
                    .catch(function(
                    ){});
            }
        })
        .catch(function(err){
            throw err;
        });
};

loader.createBlobUrlFromCache = function(filename,path){
    let arrayBuffer =  this._dataPack[path][filename].content;
    let blob = new Blob([arrayBuffer]);
    return window.URL.createObjectURL(blob);
};

loader.isCached = function(filename,path){
    path = path || 'data';
    return this._dataPack[path] && this._dataPack[path][filename];
};

loader.isValidFile = function(filename){
    let lastIndex = filename.lastIndexOf('.');
    let fileSuffix = ['.png','.json'];
    if(lastIndex <0)
        return false;
    if(fileSuffix.indexOf(filename.slice(lastIndex)) === -1)
        return false;
    else
        return true;
}

loader.formatFilename = function(filename,path){
       if(!this.isValidFile(filename)) {
           if (path === 'img') {
               filename+= '.png';
           }
       }
       return filename;
};

loader.getUrl = function(filename,path,callback){
    filename = loader.formatFilename(filename,path);
    let cached = this.isCached(filename,path);
    if(cached)
        callback(loader.createBlobUrlFromCache(filename,path));
    else
    {
        let request = this._db.transaction(path).objectStore(path).get(filename);
        request.onsuccess = function(event){
            if(!loader._dataPack.img)
                loader._dataPack.img = {};
            if(request.result)
            {
                loader._dataPack.img[filename] = request.result;
                loader._dataPack.img[filename].referred = 1;
                callback(loader.createBlobUrlFromCache(filename,path));
            }
            else {
                viewport.printLoadingError(filename);
            }

        };

        request.onerror = function(event){
        };
    }
};

loader.getInfo = function(filename,path,callback){
    filename = loader.formatFilename(filename,path);
    let cached = this.isCached(filename,path);
    if(cached)
        callback(loader._dataPack[path][filename]);
    else
    {
        let request = this._db.transaction(path).objectStore(path).get(filename);
        request.onsuccess = function(event){
            if(!loader._dataPack.img)
                loader._dataPack.img = {};
            if(request.result)
            {
                loader._dataPack.img[filename] = request.result;
                loader._dataPack.img[filename].referred = 1;
                callback(loader._dataPack[path][filename]);
            }
            else {
                viewport.printLoadingError(filename);
            }

        };
        request.onerror = function(event){
        };
    }
};

loader.getBitmapUrl = function(filename,callback){
    if(!filename || filename.length === '')
        return null;
    loader.getUrl(filename,'img',callback);
};

loader.getBitmapInfo = function(filename,callback){
    if(!filename || filename.length === '')
        return null;
    loader.getInfo(filename,'img',callback);
}

loader.update = function(){
    if(this._extractProgress >= 100 && updateManager.isRegistered(this))
        updateManager.removeUpdate(this);

    if(window['JSZip'] && !this._extracted && this._downloadProgress >= 100){
        this._extracted = true;
        loader.unzip();
    }
};


loader.initialize();