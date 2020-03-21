var gameText = null;

var scriptManager = function(){
    throw new Error('This is a static class');
};

scriptManager.initialize = function(){
    this._fullList = window['libs'] || [];
    this._moduleList = window['modules'] || [];
    this._gameTextLoading = false;
    this._reloadList = [];
    this._loadedList = [];
    this._retryList = [];
    this._errorList = [];
    this._initialized = true;
    this.requestLoad();
};

scriptManager.loadGameText = function(){
    this._gameTextLoading = true;
    let newUrl = '/game/text/'+id;
    let request = new XMLHttpRequest();
    request.open("GET", newUrl);
    request.responseType = "text/plain";
    request.send();
    request.onload = function () {
        scriptManager._gameTextLoading = false;
        if(request.response && request.status <= 400){
            gameText = JSON.parse(LZString.decompressFromBase64(request.response));
        }else
            gameText = [];
        scriptManager.autoStart();
    };
};

scriptManager.checkDependency = function(link){
    let result = true;
    for(let i=0;i< link.dependencies.length;++i){
        let depend = link.dependencies[i];
        if(this._loadedList.indexOf(depend) === -1)
        {
            result = false;
            break;
        }
    }
    return result;
};

scriptManager.checkReload = function(dl){
    this._reloadList.forEach(function(link,i,arr){
        if(scriptManager.checkDependency(link))
            dl.push(link);
    });

    dl.forEach(function(link){
        if(scriptManager._reloadList.indexOf(link)!== -1)
            scriptManager._reloadList.splice(scriptManager._reloadList.indexOf(link),1);
    })
};

scriptManager.checkLibrary=function(dl){
    this._fullList.forEach(function(link,i,arr){
        if(scriptManager.checkDependency(link))
        {
            dl.push(link);
        }
        else
        {
            scriptManager._reloadList.push(link);
            scriptManager._fullList.splice(scriptManager._fullList.indexOf(link),1);
        }
    });

    dl.forEach(function(link){
        if(scriptManager._fullList.indexOf(link)!== -1)
            scriptManager._fullList.splice(scriptManager._fullList.indexOf(link),1);
    })
};

scriptManager.checkRetry =function(dl){
    this._retryList.forEach(function(link,i,arr){
        if(link.attempted <3){
            arr[i].attempted++;
            dl.push(link.link);
        }
    });

    dl.forEach(function(link){
        if(scriptManager._retryList.indexOf(link)!== -1)
            scriptManager._retryList.splice(scriptManager._retryList.indexOf(link),1);
    })
};

scriptManager.checkModules = function(dl){
    this._moduleList.forEach(function(link,i,arr){
        if(scriptManager.checkDependency(link))
            dl.push(link);
    });

    dl.forEach(function(link){
        if(scriptManager._moduleList.indexOf(link)!== -1)
            scriptManager._moduleList.splice(scriptManager._moduleList.indexOf(link),1);
    });
};

scriptManager.updateRetry = function(link){
    let insert = true;
    for(let i=0;i<this._retryList.length;++i)
    {
        let attempt = this._retryList[i];
        if(attempt.link === link){
            this._retryList[i].attempted++;
            insert =false;
        }
        if(attempt.attempted >= 3)
        {
            this._errorList.push(attempt.link);
            this._retryList[i] = null;
        }
    }

    if(insert)
        this._retryList.push({attempted:0,link});

    while(this._retryList.indexOf(null)!== -1) {
        this._retryList.splice(this._retryList.indexOf(null),1);
    }
};

scriptManager.append=function(link){
    let script =scriptManager.loadScript(link);
    let head = document.getElementsByTagName('header');
    let body = document.getElementsByTagName('body');
    if(body.length>0)
        body[0].appendChild(script);
    else if(head.length >0)
        head[0].appendChild(script);
    else
        this.updateRetry(link);
};

scriptManager.checkTextLoad = function(){
    if(this._loadedList.indexOf('lzString') >=0 && !this._gameTextLoading && !gameText){
        this.loadGameText();
    }
};

scriptManager.requestLoad = function(){
    let downloadList = [];
    scriptManager.checkReload(downloadList);
    scriptManager.checkLibrary(downloadList);
    scriptManager.checkModules(downloadList);
    scriptManager.checkRetry(downloadList);
    scriptManager.checkTextLoad()
    downloadList.forEach(function(list){
        scriptManager.append(list);
    })
};

scriptManager.finishReload = function(filename){
    for(let i=0; i<scriptManager._reloadList.length;++i)
    {
        if(this._reloadList[i].name === filename) {
               this._reloadList.splice(i,1);
               break;
        }
    }
};

scriptManager.finishLibrary = function(filename){
    for(let i=0; i<scriptManager._fullList.length;++i)
    {
        if(this._fullList[i].name === filename) {
            this._fullList.splice(i,1);
            break;
        }
    }
};

scriptManager.finishRetry = function(filename){
    for(let i=0; i<scriptManager._retryList.length;++i)
    {
        if(this._retryList[i].name === filename) {
            this._retryList.splice(i,1);
            break;
        }
    }
};

scriptManager.modulesLoaded = function(){
  for(let i=0; i<this._moduleList.length;++i){
      if(this._loadedList.indexOf(this._moduleList[i])<0)
          return false;
  }
  return !!gameText;
};

scriptManager.autoStart = function(){
    if(this._loadedList.indexOf('boot') >0 && this.modulesLoaded())
        Game_Boot.boot();
};

scriptManager.finishLoad = function(filename){
    this._loadedList.push(filename);
    this.finishReload(filename);
    this.finishLibrary(filename);
    this.finishRetry(filename);
    this.autoStart()
    scriptManager.requestLoad();
};

scriptManager.loadScript = function(link){
    let script = document.createElement('script');
    script.src = link.path;
    script.type = "text/javascript";
    script.onload= this.finishLoad.bind(this,link.name);
    script.defer = true;
    return script;
};

scriptManager.getProgress = function(){
   let completed = this._loadedList.length;
   let tobeCompleted = this._fullList.length + this._retryList.length + this._reloadList.length;
   return completed/(completed+tobeCompleted) *100;
};

scriptManager.initialize();