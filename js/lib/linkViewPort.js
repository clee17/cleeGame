function Graphics(){
    throw new Error('This is a static class');
}

Graphics.initialize = function(parent,width,height)
{
    if(this._initialized)
        return;
    this._width = width || 1280;
    this._height = height || 720;
    this._parent = parent || document.body;
    this._initialized = true;

    this._loading = false;
    this._srcCount = 0;
    this._loadingProgress = 0;
    this._titleLoading = false;
    this._loadingCount = 0;
    this._booted = false;

    this._realScale = 1;
    this._canvas = null;
    this._renderer = null;

    this._loading = false;
    this._loadingImage = null;

    this._fadeDuration = 0;
    this._fadeSign = 0;
    this._title = null;

    this._skipCount = 0;
    this._maxSkip = 3;
    this._rendered = false;

    this._reference = null;
    this._titleResource = [];
    this._errorUrl = "data:image/png;base64,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";


    this._initialized= true;

    this.setLoadingImage();
    this.preLoadTitle();
    this._updateRealScale();
    this._createAllElements();
    this.requestUpdate();
};


Object.defineProperty(Graphics, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        if (this._width !== value) {
            this._width = value;
            this._updateAllElements();
        }
    },
    configurable: true
});

Object.defineProperty(Graphics, 'height', {
    get: function() {
        return this._height;
    },
    set: function(value) {
        if (this._height !== value) {
            this._height = value;
            this._updateAllElements();
        }
    },
    configurable: true
});

Graphics.updateAllElements = function(){
    this._updateRealScale();
    this._updateCanvas();
    this._updateRenderer();
};

Graphics.frameCount     = 0;

Graphics.setLoadingImage = function(src){
    let path = src || '/img/Loading.png';
    this._loadingImage = new Image();
    this._loadingImage.src = path;
};


Graphics.mergeChunk = function(chunkList)
{
    if(chunkList.length ==0)
        return null;
    let totalLength = 0;
    let viewList = [];
    for(let i=0;i<chunkList.length;++i)
    {
        totalLength+= chunkList[i].byteLength;
        viewList.push(new Uint8Array(chunkList[i]));
    }
    let ab = new ArrayBuffer(totalLength);
    let bytes = new Uint8Array(ab);
    let index = 0;
    for(let i=0;i<viewList.length;++i)
    {
        for(let j=0;j<viewList[i].length;++j,index++)
            bytes[index] = viewList[i][j];
    }
    return ab;
};

Graphics.preLoadTitle = function(){
    let url = path+'/img/title';
    let chunkList = [null,null,null];
    for(let i=0;i<3;++i)
    {
        let newUrl= url+'?id='+i;
        let requestFile = new XMLHttpRequest();
        requestFile.open("GET", newUrl);
        requestFile.responseType = "arraybuffer";
        requestFile.sign = i;
        requestFile.send();
        requestFile.onload = function () {
            if(requestFile.response && requestFile.status <= 400)
            {
                chunkList[i] = requestFile.response;
                if(chunkList.indexOf(null) == -1)
                {
                    Graphics._reference =  Graphics.mergeChunk(chunkList);
                    let blob=new Blob([Graphics._reference]);
                    var reader = new FileReader();
                    reader.addEventListener("loadend", function() {
                        Graphics._reference = JSON.parse(reader.result);
                        if(Graphics._reference)
                            Graphics.loadResource();

                    });
                    reader.readAsBinaryString(blob);
                }
            }
        };

        requestFile.onerror = function (err) {
            console.log(err);
        };
    }
};

Graphics.loadResource = function(){
    if(!this._reference || this._titleResource.length>0)
        return;
    let maxLength = this._reference.maxFiles;
    this._titleResource.length = maxLength;
    this._titleResource.fill(null,0);
    for(let i=0;i<maxLength;++i)
    {
        let url = path+'/img/title/request';
        let newUrl= url+'?id='+i;
        let requestFile = new XMLHttpRequest();
        requestFile.open("GET", newUrl);
        requestFile.responseType = "arraybuffer";
        requestFile.sign = i;
        requestFile.send();
        requestFile.onload = function () {
            Graphics._titleResource[this.sign] = requestFile.response;
            if(Graphics._titleResource.indexOf(null) === -1)
            {
                Graphics.loadAllTitleImage();
            }
        };
    }
};

Graphics.getTitleImage = function(name){
    name+='.png';
    if(!this._reference.index[name].img)
        return this._errorUrl;
    return this._reference.index[name].img;
};

Graphics.resolveTitleImg = function(name){
    if(!this._reference.index[name])
        return this._errorUrl;
    let info = this._reference.index[name];
    let buffer = new ArrayBuffer(info.fileSize);
    let view = new Uint8Array(buffer);
    let startFileId = info.fileId;
    let endFileId = Math.ceil((info.startIndex+info.fileSize)/100000)+startFileId;
    let viewList = [];
    for (let i=startFileId;i<endFileId;++i)
    {
        viewList.push(new Uint8Array(this._titleResource[i]));
    }
    let startIndex = info.startIndex;
    for(let i=0;i<info.fileSize;++i,++startIndex)
    {
        let fileId = parseInt(startIndex/100000);
        let currentIndex = startIndex%100000;

        view[i] = viewList[fileId][currentIndex];
    }

    return buffer;



};

Graphics.loadAllTitleImage = function(){
    for(let obj in this._reference.index)
    {
        let img = Graphics.resolveTitleImg(obj);
        let reader = new FileReader;
        reader.onload = function(){
            if(reader.result)
            {
                Graphics._reference.index[obj].img = reader.result;
            }
        };
        let blob = new Blob([img]);
        reader.readAsDataURL(blob);
    }
};

Graphics._updateRealScale = function(){
    var h = this._parent.offsetWidth / this._width;
    if (h >= 1 && h - 0.01 <= 1) h = 1;
    this._realScale = h;
};

Graphics._createAllElements = function(){
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'GameCanvas';
    this._canvas.style.zIndex = 0;
    this._updateCanvas();
    this._parent.appendChild(this._canvas);
    this._createRenderer();
    this._updateRenderer();
};

Graphics._createRenderer = function(){
    PIXI.dontSayHello = true;
    var width = this._width;
    var height = this._height;
    var options = { view: this._canvas };
    try {
        this._renderer = PIXI.autoDetectRenderer(width, height, options);
        if(this._renderer && this._renderer.textureGC)
            this._renderer.textureGC.maxIdle = 1;
    } catch (e) {
        this._renderer = null;
    }
};

Graphics._updateCanvas = function(){
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._canvas.style.zIndex = 1;
    this._centerElement(this._canvas);
};

Graphics._centerElement = function(element){
    var width = element.width*this._realScale;
    var height = element.height * this._realScale;

    element.style.position = 'absolute';
    element.style.margin = 'auto';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = (this._parent.style.height/2 - height/2)+'px';
    element.style.left = (this._parent.style.width/2 - width/2)+'px';
};
Graphics.render = function(stage) {
    if (this._skipCount === 0) {

        var startTime = Date.now();
        if (stage) {
            this._renderer.render(stage);
            if (this._renderer.gl && this._renderer.gl.flush) {
                this._renderer.gl.flush();
            }
        }
        var endTime = Date.now();
        var elapsed = endTime - startTime;
        this._skipCount = Math.min(Math.floor(elapsed / 15), this._maxSkip);
        this._rendered = true;
    } else {
        this._skipCount--;
        this._rendered = false;
    }
    this.frameCount++;
};

Graphics.startLoading = function(){
    if(this._loading)
        return;
    this._loadingDiv.innerHTML = 'LOADING';
    this._loadingCount = 0;
    this._loading=true;
};

Graphics.updateLoading = function() {
    if(!this._loading)
        return;
    this._loadingCount++;
};

Graphics.endLoading = function() {
    this._loading = false;
};

Graphics.updateTitle = function(){
    if(!this._titleLoading || !this._reference)
        return;
    if(!this._title && typeof Scene_Title !== "undefined")
        this._title = new Scene_Title();
    else if(this._title && this._title.isReady())
    {
        this.endLoading();
        if(!this._title.isStarted())
            this._title.startAnimation();
        this._title.update();
        this.render(this._title);
    }
};

Graphics.updateTitlePrep = function(){
    if(!this._reference || this._titleLoading)
        return;
    for(let obj in this._reference.index)
    {
        if(!this._reference.index[obj].img)
            return;
    }
    this._titleLoading = true;
};

Graphics.update = function(){
    this.updateLoading();
    this.updateTitlePrep();
    this.updateTitle();
    this.requestUpdate();
};

Graphics.requestUpdate = function() {
    if (this._initialized) {
        requestAnimationFrame(this.update.bind(this));
    }
};

Graphics.loadProgress = function(){
    Graphics._loadingProgress++;
};

Graphics.preLoad = function(srcList){
    this._loading = true;
    this._srcCount = srcList.length;
    this._loadingProgress = 0;
    this.requestUpdate();
};

Graphics._updateRenderer = function() {
    if (this._renderer) {
        this._renderer.resize(this._width, this._height);
    }
};