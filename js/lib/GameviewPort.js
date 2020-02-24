function Graphics() {
    throw new Error('This is a static class');
}
Graphics._cssFontLoading =  document.fonts && document.fonts.ready;
Graphics._fontLoaded = null;
Graphics._videoVolume = 1;
Graphics.initialize = function(width, height, type) {
    if(this._initialized)
        return;

    this._width = width || 1280;
    this._height = height || 720;
    this._rendererType = type || 'auto';

    this._scale = 1;
    this._realScale = 1;

    this._errorShowed = false;
    this._errorPrinter = null;
    this._canvas = null;
    this._video = null;
    this._videoUnlocked = false;
    this._videoLoading = false;
    this._upperCanvas = null;
    this._renderer = null;
    this._fpsMeter = null;
    this._skipCount = 0;
    this._maxSkip = 3;
    this._rendered = false;
    this._loadingImage = null;
    this._loading = false;
    this._loadingCount = 0;
    this._fpsMeterToggled = false;
    this._stretchEnabled = true;

    this._canUseDifferenceBlend = false;
    this._canUseSaturationBlend = false;
    this._hiddenCanvas = null;

    this._initialized= true;
    this._titleLoading = false;
    this._booted = false;
    this._title = null;
    this._fadeSign = 0;
    this._fadeDuration = 0;

    this._reference = null;
    this._titleResource = [];
    this._errorUrl = "data:image/png;base64,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";

    this.setLoadingImage();
    this.preLoadTitle();
    this._testCanvasBlendModes();
    this._modifyExistingElements();
    this._updateRealScale();
    this._createAllElements();
    this._disableTextSelection();
    this._disableContextMenu();
    this._adjustOnBrowser();
    this._setupEventHandlers();

    this.startLoading();
    this.requestUpdate();
};

Graphics.boot = function(){
    this._booted = true;
    this._createFPSMeter();
    makeVideoPlayableInline(this._video);
};

Graphics.tickStart = function() {
    if (this._fpsMeter) {
        this._fpsMeter.tickStart();
    }
};

Graphics.tickEnd = function() {
    if (this._fpsMeter && this._rendered) {
        this._fpsMeter.tick();
    }
};

Graphics.frameCount     = 0;
Graphics.BLEND_NORMAL   = 0;
Graphics.BLEND_ADD      = 1;
Graphics.BLEND_MULTIPLY = 2;
Graphics.BLEND_SCREEN   = 3;

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
Graphics.isWebGL = function() {
    return this._renderer && this._renderer.type === PIXI.RENDERER_TYPE.WEBGL;
};
Graphics.hasWebGL = function() {
    try {
        var canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
};
Graphics.canUseDifferenceBlend = function() {
    return this._canUseDifferenceBlend;
};
Graphics.canUseSaturationBlend = function() {
    return this._canUseSaturationBlend;
};

Graphics.setLoadingImage = function(src) {
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
                if(requestFile.response)
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

Graphics.startLoading = function(){
    if(this._loading)
        return;
    this._loadingCount = 0;
    this._loading=true;
};

Graphics.updateLoading = function() {
    if(!this._loading)
        return;
    this._loadingCount++;
    this._paintUpperCanvas();
    this._upperCanvas.style.opacity = 1;
};
Graphics.endLoading = function() {
    this._loading = false;
    this._clearUpperCanvas();
    this._upperCanvas.style.opacity = 0;
};
Graphics.endLoadingAndFade = function(){
    if(!this._loading)
        return;
    this._loading = false;
    this._clearUpperCanvas();
    this._fadeSign = 1;
    this._fadeDuration = 30.0;
    this._upperCanvas.style.opacity = 1;
};

Graphics.printLoadingError = function(url) {
    if (this._errorPrinter && !this._errorShowed) {
        this._errorPrinter.innerHTML = this._makeErrorHtml('Loading Error', 'Failed to load: ' + url);
        var button = document.createElement('button');
        button.innerHTML = 'Retry';
        button.style.fontSize = '24px';
        button.style.color = '#ffffff';
        button.style.backgroundColor = '#000000';
        button.onmousedown = button.ontouchstart = function(event) {
            ResourceHandler.retry();
            event.stopPropagation();
        };
        this._errorPrinter.appendChild(button);
        this._loadingCount = -Infinity;
    }
};
Graphics.eraseLoadingError = function() {
    if (this._errorPrinter && !this._errorShowed) {
        this._errorPrinter.innerHTML = '';
        this.startLoading();
    }
};
Graphics.printError = function(name, message) {
    this._errorShowed = true;
    if (this._errorPrinter) {
        this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
    }
    this._applyCanvasFilter();
    this._clearUpperCanvas();
};
Graphics.showFps = function() {
    if (this._fpsMeter) {
        this._fpsMeter.show();
    }
};
Graphics.hideFps = function() {
    if (this._fpsMeter) {
        this._fpsMeter.hide();
    }
};
Graphics.loadFont = function(name, url) {
    var style = document.createElement('style');
    var head = document.getElementsByTagName('head');
    var rule = '@font-face { font-family: "' + name + '"; src: url("' + url + '"); }';
    style.type = 'text/css';
    head.item(0).appendChild(style);
    style.sheet.insertRule(rule, 0);
    this._createFontLoader(name);
};
Graphics.isFontLoaded = function(name) {
    if (Graphics._cssFontLoading) {
        if(Graphics._fontLoaded){
            return Graphics._fontLoaded.check('10px "'+name+'"');
        }
        return false;
    } else {
        if (!this._hiddenCanvas) {
            this._hiddenCanvas = document.createElement('canvas');
        }
        var context = this._hiddenCanvas.getContext('2d');
        var text = 'abcdefghijklmnopqrstuvwxyz';
        var width1, width2;
        context.font = '40px ' + name + ', sans-serif';
        width1 = context.measureText(text).width;
        context.font = '40px sans-serif';
        width2 = context.measureText(text).width;
        return width1 !== width2;
    }
};
Graphics.playVideo = function(src) {
    this._videoLoader = ResourceHandler.createLoader(null, this._playVideo.bind(this, src), this._onVideoError.bind(this));
    this._playVideo(src);
};
Graphics._playVideo = function(src) {
    this._video.src = src;
    this._video.onloadeddata = this._onVideoLoad.bind(this);
    this._video.onerror = this._videoLoader;
    this._video.onended = this._onVideoEnd.bind(this);
    this._video.load();
    this._videoLoading = true;
};

Graphics.isVideoPlaying = function() {
    return this._videoLoading || this._isVideoVisible();
};
Graphics.canPlayVideoType = function(type) {
    return this._video && this._video.canPlayType(type);
};
Graphics.setVideoVolume = function(value) {
    this._videoVolume = value;
    if (this._video) {
        this._video.volume = this._videoVolume;
    }
};
Graphics.pageToCanvasX = function(x) {
    if (this._canvas) {
        var left = this._canvas.offsetLeft;
        return Math.round((x - left) / this._realScale);
    } else {
        return 0;
    }
};

Graphics.pageToCanvasY = function(y) {
    if (this._canvas) {
        var top = this._canvas.offsetTop;
        return Math.round((y - top) / this._realScale);
    } else {
        return 0;
    }
};

Graphics.isInsideCanvas = function(x, y) {
    return (x >= 0 && x < this._width && y >= 0 && y < this._height);
};

Graphics.callGC = function() {
    if (Graphics.isWebGL()) {
        Graphics._renderer.textureGC.run();
    }
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

Object.defineProperty(Graphics, 'boxWidth', {
    get: function() {
        return this._boxWidth;
    },
    set: function(value) {
        this._boxWidth = value;
    },
    configurable: true
});

Object.defineProperty(Graphics, 'boxHeight', {
    get: function() {
        return this._boxHeight;
    },
    set: function(value) {
        this._boxHeight = value;
    },
    configurable: true
});

Object.defineProperty(Graphics, 'scale', {
    get: function() {
        return this._scale;
    },
    set: function(value) {
        if (this._scale !== value) {
            this._scale = value;
            this._updateAllElements();
        }
    },
    configurable: true
});
Graphics._createAllElements = function() {
    this._createErrorPrinter();
    this._createCanvas();
    this._createVideo();
    this._createUpperCanvas();
};

Graphics._updateAllElements = function() {
    this._updateRealScale();
    this._updateErrorPrinter();
    this._updateCanvas();
    this._updateVideo();
    this._updateUpperCanvas();
    this._updateRenderer();
    this._paintUpperCanvas();
};

Graphics._updateRealScale = function() {
    if (this._stretchEnabled) {
        var h = window.innerWidth / this._width;
        var v = window.innerHeight / this._height;
        if (h >= 1 && h - 0.01 <= 1) h = 1;
        if (v >= 1 && v - 0.01 <= 1) v = 1;

        if(!this._isFullScreen())
            this._realScale = Math.min(h, v);
        else
            this._realScale = Math.max(h, v);

        if(this._isLargest())
            this._realScale = Math.min(h, v);
    } else {
        this._realScale = this._scale;
    }
};


Graphics.preferableRendererType = function() {
    if (Utils.isOptionValid('canvas')) {
        return 'canvas';
    } else if (Utils.isOptionValid('webgl')) {
        return 'webgl';
    } else {
        return 'auto';
    }
};

Graphics._makeErrorHtml = function(name, message) {
    return ('<font color="yellow"><b>' + name + '</b></font><br>' +
        '<font color="white">' + message + '</font><br>');
};

Graphics._testCanvasBlendModes = function() {
    var canvas, context, imageData1, imageData2;
    canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    context = canvas.getContext('2d');
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'white';
    context.fillRect(0, 0, 1, 1);
    context.globalCompositeOperation = 'difference';
    context.fillStyle = 'white';
    context.fillRect(0, 0, 1, 1);
    imageData1 = context.getImageData(0, 0, 1, 1);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'black';
    context.fillRect(0, 0, 1, 1);
    context.globalCompositeOperation = 'saturation';
    context.fillStyle = 'white';
    context.fillRect(0, 0, 1, 1);
    imageData2 = context.getImageData(0, 0, 1, 1);
    this._canUseDifferenceBlend = imageData1.data[0] === 0;
    this._canUseSaturationBlend = imageData2.data[0] === 0;
};

Graphics._modifyExistingElements = function() {
    var elements = document.getElementsByTagName('*');
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].style.zIndex > 0) {
            elements[i].style.zIndex = 0;
        }
    }
};

Graphics._createErrorPrinter = function() {
    this._errorPrinter = document.createElement('p');
    this._errorPrinter.id = 'ErrorPrinter';
    this._updateErrorPrinter();
    document.body.appendChild(this._errorPrinter);
};

Graphics._updateErrorPrinter = function() {
    this._errorPrinter.width = this._width * 0.9;
    this._errorPrinter.height = 40;
    this._errorPrinter.style.textAlign = 'center';
    this._errorPrinter.style.textShadow = '1px 1px 3px #000';
    this._errorPrinter.style.fontSize = '20px';
    this._errorPrinter.style.zIndex = 99;
    this._centerElement(this._errorPrinter);
};

Graphics._createCanvas = function() {
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'GameCanvas';
    this._updateCanvas();
    document.body.appendChild(this._canvas);
};

Graphics._updateCanvas = function() {
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._canvas.style.zIndex = 1;
    this._centerElement(this._canvas);
};

Graphics._createVideo = function() {
    this._video = document.createElement('video');
    this._video.id = 'GameVideo';
    this._video.style.opacity = 0;
    this._video.setAttribute('playsinline', '');
    this._video.volume = this._videoVolume;
    this._updateVideo();
    document.body.appendChild(this._video);
};

Graphics._updateVideo = function() {
    this._video.width = this._width;
    this._video.height = this._height;
    this._video.style.zIndex = 2;
    this._centerElement(this._video);
};

Graphics._createUpperCanvas = function() {
    this._upperCanvas = document.createElement('canvas');
    this._upperCanvas.id = 'UpperCanvas';
    this._upperCanvas.style.background = 'black';
    this._updateUpperCanvas();
    document.body.appendChild(this._upperCanvas);
};

Graphics._updateUpperCanvas = function() {
    this._upperCanvas.width = this._width;
    this._upperCanvas.height = this._height;
    this._upperCanvas.style.zIndex = 3;
    this._centerElement(this._upperCanvas);
};
Graphics._clearUpperCanvas = function() {
    var context = this._upperCanvas.getContext('2d');
    context.clearRect(0, 0, this._width, this._height);
};

Graphics._paintUpperCanvas = function() {
    this._clearUpperCanvas();
    if (this._loadingImage && this._initialized && this._loading) {
        var context = this._upperCanvas.getContext('2d');
        var dx = (this._width - this._loadingImage.width) / 2;
        var dy = (this._height - this._loadingImage.height) / 2;
        var alpha = ((this._loadingCount)%40 / 30).clamp(0, 1);
        context.save();
        context.globalAlpha = alpha;
        context.drawImage(this._loadingImage, dx, dy);
        context.strokeStyle="white";
        context.lineWidth = 2.0;
        context.globalAlpha = 1;
        context.font = "20px Arial";
        context.strokeText(loadingManager._loadingProgress.toString(),this._width-100,this._height-100);
        context.restore();
    }
};
Graphics._createRenderer = function() {
    PIXI.dontSayHello = true;
    var width = this._width;
    var height = this._height;
    var options = { view: this._canvas };
    try {
        switch (this._rendererType) {
            case 'canvas':
                this._renderer = new PIXI.CanvasRenderer(width, height, options);
                break;
            case 'webgl':
                this._renderer = new PIXI.WebGLRenderer(width, height, options);
                break;
            default:
                this._renderer = PIXI.autoDetectRenderer(width, height, options);
                break;
        }

        if(this._renderer && this._renderer.textureGC)
            this._renderer.textureGC.maxIdle = 1;

    } catch (e) {
        this._renderer = null;
    }
};
Graphics._createFPSMeter = function() {
    var options = { graph: 1, decimals: 0, theme: 'transparent', toggleOn: null };
    this._fpsMeter = new FPSMeter(options);
    this._fpsMeter.hide();
};
Graphics._updateRenderer = function() {
    if (this._renderer) {
        this._renderer.resize(this._width, this._height);
    }
};


Graphics._createFontLoader = function(name) {
    var div = document.createElement('div');
    var text = document.createTextNode('.');
    div.style.fontFamily = name;
    div.style.fontSize = '0px';
    div.style.color = 'transparent';
    div.style.position = 'absolute';
    div.style.margin = 'auto';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.width = '1px';
    div.style.height = '1px';
    div.appendChild(text);
    document.body.appendChild(div);
};
Graphics._centerElement = function(element) {
    var width = element.width*this._realScale;
    var height = element.height * this._realScale;

    element.style.position = 'absolute';
    element.style.margin = 'auto';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = (window.innerHeight/2 - height/2)+'px';
    element.style.left = 0;
    element.style.marginLeft = (window.innerWidth/2 - width/2)+'px';
};

Graphics._disableTextSelection = function() {
    var body = document.body;
    body.style.userSelect = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.msUserSelect = 'none';
    body.style.mozUserSelect = 'none';
};

Graphics._disableContextMenu = function() {
    var elements = document.body.getElementsByTagName('*');
    var oncontextmenu = function() { return false; };
    for (var i = 0; i < elements.length; i++) {
        elements[i].oncontextmenu = oncontextmenu;
    }
};

Graphics._adjustOnBrowser = function(){
    if(Utils.isMobileSafari() && screen.width <= 560)
    {
        if(document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
            bodyTag = document.getElementsByTagName('body')[0];
            bodyTag.style.height = document.documentElement.clientWidth / screen.width * screen.height + 'px';
        }
    }
};

Graphics._applyCanvasFilter = function() {
    if (this._canvas) {
        this._canvas.style.opacity = 0.5;
        this._canvas.style.filter = 'blur(8px)';
        this._canvas.style.webkitFilter = 'blur(8px)';
    }
};

Graphics._onVideoLoad = function() {
    this._video.play();
    this._updateVisibility(true);
    this._videoLoading = false;
};

Graphics._onVideoError = function() {
    this._updateVisibility(false);
    this._videoLoading = false;
};

Graphics._onVideoEnd = function() {
    this._updateVisibility(false);
};

Graphics._updateVisibility = function(videoVisible) {
    this._video.style.opacity = videoVisible ? 1 : 0;
    this._canvas.style.opacity = videoVisible ? 0 : 1;
};

Graphics._isVideoVisible = function() {
    return this._video.style.opacity > 0;
};
Graphics._setupEventHandlers = function() {
    window.addEventListener('resize', this._onWindowResize.bind(this));
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keydown', this._onTouchEnd.bind(this));
    document.addEventListener('mousedown', this._onTouchEnd.bind(this));
    document.addEventListener('touchend', this._onTouchEnd.bind(this));
};
Graphics._onWindowResize = function() {
    this._updateAllElements();
};
Graphics._onKeyDown = function(event) {
    if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
            case 113:   // F2
                event.preventDefault();
                this._switchFPSMeter();
                break;
            case 114:   // F3
                event.preventDefault();
                this._switchStretchMode();
                break;
            case 122:   // F11
                event.preventDefault();
                this._switchFullScreen();
                break;
        }
    }
};
Graphics._onTouchEnd = function(event) {
    if (!this._videoUnlocked) {
        this._video.play();
        this._videoUnlocked = true;
    }
    if (this._isVideoVisible() && this._video.paused) {
        this._video.play();
    }
};
Graphics._switchFPSMeter = function() {
    if(!this._fpsMeter)
        return;
    if (this._fpsMeter.isPaused) {
        this.showFps();
        this._fpsMeter.showFps();
        this._fpsMeterToggled = false;
    } else if (!this._fpsMeterToggled) {
        this._fpsMeter.showDuration();
        this._fpsMeterToggled = true;
    } else {
        this.hideFps();
    }
};

Graphics._switchStretchMode = function() {
    this._stretchEnabled = !this._stretchEnabled;
    this._updateAllElements();
};

Graphics._switchFullScreen = function() {
    if (this._isFullScreen()) {
        this._requestFullScreen();
    } else {
        this._cancelFullScreen();
    }
    this._updateRealScale();
};

Graphics._isFullScreen = function() {
    return ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitFullscreenElement &&
            !document.msFullscreenElement));
};

Graphics._isLargest = function(){
    if(Utils.isMobileSafari())
        return true;
    let heightPortion = this._height*this._realScale*0.1;
    let widthPortion = this._width*this._realScale*0.1;
    if(screen.availWidth/screen.availHeight >= this._width/this.height)
    {
        return Math.abs(this._width*this._realScale - window.screen.availWidth) <= widthPortion && this._height*this._realScale - window.outerHeight >= heightPortion;
    }
    else{
        return Math.abs(this._height*this._realScale - window.outerHeight) <= heightPortion && this._width*this._realScale - window.screen.availWidth >= widthPortion;
    }
};

Graphics._requestFullScreen = function() {
    var element = document.body;
    if (element.requestFullScreen) {
        element.requestFullScreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
};
Graphics._cancelFullScreen = function() {
    if (document.cancelFullScreen) {
        document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
};

Graphics.updateTitlePrep = function(){
    if(!this._reference || this._titleLoading)
        return;
   for(let obj in this._reference.index)
   {
       if(!this._reference.index[obj].img)
       {
           this._titleLoading = false;
           return;
       }

   }
   this._titleLoading = true;
};

Graphics.updateTitle = function(){
    if(!this._titleLoading)
        return;
    if(!this._title && Scene_Title)
    {
        this._title = new Scene_Title();
    }
    else if(this._title && this._title.isReady())
    {
        this.endLoadingAndFade();
        if(this._upperCanvas.style.opacity <= 0.1 && !this._title.isStarted())
        {
            this._title.startAnimation();
        }
        this._title.update();
        this.render(this._title);
    }
};

Graphics.updateFade = function(){
    if (this._fadeDuration > 0) {
        var d = this._fadeDuration;
        if (this._fadeSign > 0) {
            let newOpacity =  this._upperCanvas.style.opacity - this._upperCanvas.style.opacity / d;
            this._upperCanvas.style.opacity = newOpacity;
        } else {
            this._upperCanvas.style.opacity = this._upperCanvas.style.opacity+ (1 - this._upperCanvas.style.opacity) / d;
        }
        this._fadeDuration--;
        if(this._fadeDuration<=0)
            this._fadeSign = 0;
    }
};

Graphics._preLoading = function() {
    this.updateLoading();
    this.updateFade();
    this.updateTitlePrep();
    this.updateTitle();
    if(typeof PIXI != 'undefined' && !this._renderer)
        this._createRenderer();
    this.requestUpdate();
};


Graphics.requestUpdate = function() {
    if (!this._booted && this._initialized)
        requestAnimationFrame(this._preLoading.bind(this));
};


