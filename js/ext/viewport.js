function Cover_Layer(){
   this.initialize.apply(this,arguments);
}

Cover_Layer.prototype.initialize = function(){
    this._stashedAnimation = [];
    this._id = '';
    this._div =  document.createElement('div');
    this._div.style.background = 'black';
    let innerHTML = '<div id ="info" style="display:flex;flex-direction:column;width:100%;height:100%;">' +
        '<div style="font-weight:bold;font-size:2.5rem;color:white;margin:auto;animation:blink 1s infinite ease-in-out;">游戏加载中...</div></div>' +
        '<div id="bar" style="background:white;width:1%;min-height:8px;position:absolute;bottom:5px;left:0;transition:width 0.4s;z-index=0;border-radius:5px;"></div>';
    this._div.innerHTML = innerHTML;
    return this;
};

Cover_Layer.prototype.setStyle = function(name,value){
   this._div.style[name] = value;
};

Cover_Layer.prototype.update = function () {
    this.updateProgress();
    this.updateChildren();
};

Cover_Layer.prototype.updateChildren = function(){
};

Cover_Layer.prototype.disableAnimation = function(children){
    for(let i=0; i<children.length;++i){
        let subChildren = children[i].children;
        if(subChildren.length>0)
            this.disableAnimation(subChildren);
        if(children[i].style.animation)
        {
            this._stashedAnimation.push({id:children[i].id,animation:children[i].style.animation});
            children[i].style.animation = '';
        }
    }
};

Cover_Layer.prototype.pause = function(){
     this.disableAnimation(this._div.children);
    this._div.style.filter = 'blur(10px)';
};

Cover_Layer.prototype.getProgress = function(){
    let resourceProgress = 0;
    let scriptProgress = 0;
    let bootProgress = 0;
    if (window['loader'])
        resourceProgress = window['loader'].getProgress();
    if (window['scriptManager'])
        scriptProgress = window['scriptManager'].getProgress();
    if( window['Game_Boot'])
        bootProgress = window['Game_Boot'].getProgress();
    return resourceProgress / 100 *25 + scriptProgress / 100 * 25 +bootProgress/100*50;
};

Cover_Layer.prototype.updateProgress = function(){
    this.updateProgressAnimation(this.getProgress());
};

Cover_Layer.prototype.updateProgressAnimation = function(finalProgress){
    let bar = this.getElementById('bar');
    if(bar)
        bar.style.width =  finalProgress +'%';
};

Cover_Layer.prototype.appendChild = function(element){
    this._div.appendChild(element);
};

Cover_Layer.prototype.appendChild = function(element){
    this._div.appendChild(element);
};

Cover_Layer.prototype.getElementById = function(id){
    let children = this._div.children;
    for(let i=0;i<children.length;++i){
        if(children[i].id === id)
            return children[i];
    }
    return null;
};

Cover_Layer.prototype.resume = function(){
    this._div.style.filter = '';
    let children = this._div.children;
    for(let i=0;i<this._stashedAnimation.length;++i)
    {
        let refer = this._stashedAnimation[i];
        if(children[refer.index])
            children[refer.index].style.animation = refer.animation;
    }
    this._stashedAnimation.length = 0;
};

Cover_Layer.prototype.setId = function(id){
    this._div.id = id;
};

function viewport() {
    throw new Error('This is a static class');
}

viewport.initialize = function(type) {
    if(this._initialized)
        return;
    this._width = resolution.width || 1280;
    this._height = resolution.height || 720;
    this._rendererType = type || 'auto';

    this._scale = 1;
    this._realScale = 1;

    this._errorShowed = false;
    this._errorPrinter = null;
    this._canvas = null;
    this._upperCanvas = null;
    this._renderer = null;
    this._skipCount = 0;
    this._maxSkip = 3;
    this._rendered = false;
    this._stretchEnabled = true;
    this._loading = true;


    this._canUseDifferenceBlend = false;
    this._canUseSaturationBlend = false;
    this._initialized= true;
    this._title = null;
    this._fadeSign = 0;
    this._fadeDuration = 0;

    this._testCanvasBlendModes();
    this._updateRealScale();
    this._createAllElements();
    this._disableTextSelection();
    this._disableContextMenu();
    this._adjustOnBrowser();
    this._setupEventHandlers();

    this.requestUpdate();
};


Object.defineProperty(viewport, 'width', {
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

Object.defineProperty(viewport, 'height', {
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

Object.defineProperty(viewport, 'boxWidth', {
    get: function() {
        return this._boxWidth;
    },
    set: function(value) {
        this._boxWidth = value;
    },
    configurable: true
});

Object.defineProperty(viewport, 'boxHeight', {
    get: function() {
        return this._boxHeight;
    },
    set: function(value) {
        this._boxHeight = value;
    },
    configurable: true
});

Object.defineProperty(viewport, 'scale', {
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

viewport.getCover = function(){
    return this._cover;
};


viewport._isFullScreen = function() {
    return ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitFullscreenElement &&
            !document.msFullscreenElement));
};

viewport.getCurrentLength = function(){
   let width = this.width * this._realScale;
   let height = this.height * this._realScale;
   return {width:width,height:height};
};

viewport.pageToCanvasX = function(x) {
    if (this._canvas) {
        var left = this._canvas.offsetLeft;
        return Math.round((x - left) / this._realScale);
    } else {
        return 0;
    }
};

viewport.pageToCanvasY = function(y) {
    if (this._canvas) {
        var top = this._canvas.offsetTop;
        return Math.round((y - top) / this._realScale);
    } else {
        return 0;
    }
};

viewport.isInsideCanvas = function(x, y) {
    return (x >= 0 && x < this._width && y >= 0 && y < this._height);
};

viewport.callGC = function() {
    if (viewport.isWebGL()) {
        viewport._renderer.textureGC.run();
    }
};

viewport.isWebGL = function() {
    if(!PIXI)
        return false;
    return this._renderer && this._renderer.type === PIXI.RENDERER_TYPE.WEBGL;
};

viewport.hasWebGL = function() {
    try {
        var canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
};

viewport._formatCanvas = function(element){
    let width = element.width*this._realScale;
    let height = element.height * this._realScale;
    element.style.width = width + 'px';
    element.style.height = height + 'px';
};

viewport._formatDiv = function(element){
    let width = element.width*this._realScale;
    let height = element.height * this._realScale;
    element = element._div || element;
    element.style.position = 'absolute';
    element.style.transformOrigin = '0 0';
    element.style.transform = 'scale('+this._realScale+','+this._realScale+')';
    element.style.top = (window.innerHeight/2 - height/2)+'px';
    element.style.left = (window.innerWidth/2 - width/2)+'px';
};

viewport._centerElement = function(element) {
    let width = element.width*this._realScale;
    let height = element.height * this._realScale;
    element.style.position = 'absolute';
    element.style.margin = 'auto';
    element.style.top = (window.innerHeight/2 - height/2)+'px';
    element.style.left = (window.innerWidth/2 - width/2)+'px';
};

viewport._updateRealScale = function() {
    if (this._stretchEnabled) {
        var h = window.innerWidth / this._width;
        var v = window.innerHeight / this._height;
        if (h >= 1 && h - 0.01 <= 1) h = 1;
        if (v >= 1 && v - 0.01 <= 1) v = 1;

        this._realScale = Math.min(h, v);
    } else {
        this._realScale = this._scale;
    }
};

viewport._updateErrorPrinter = function() {
    this._errorPrinter.width = this._width;
    this._errorPrinter.height = this._height;
    this._errorPrinter.style.textShadow = '1px 1px 3px #000';
    this._errorPrinter.style.fontSize = '24px';
    this._errorPrinter.style.zIndex = 99;
    this._errorPrinter.style.display = 'flex';
    this._errorPrinter.style.width = this._width+'px';
    this._errorPrinter.style.height = this._height+'px';
    this._formatDiv(this._errorPrinter);
};

viewport._updateCanvas = function() {
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._canvas.style.zIndex = '1';
    this._formatCanvas(this._canvas);
    this._centerElement(this._canvas);
};

viewport._updateVideo = function() {
    if(!this._video)
        return;
    this._video.width = this._width;
    this._video.height = this._height;
    this._video.style.zIndex = 2;
    this._formatCanvas(this._video);
    this._centerElement(this._video);
};

viewport._updateUpperCanvas = function() {
    this._upperCanvas.width = this._width;
    this._upperCanvas.height = this._height;
    this._upperCanvas.style.zIndex = '3';
    this._formatCanvas(this._upperCanvas);
    this._centerElement(this._upperCanvas);
};

viewport._updateRenderer = function() {
    if (this._renderer) {
        this._renderer.resize(this._width, this._height);
    }
};

viewport._updateCover = function(){
    this._cover.width = this._width;
    this._cover.height = this._height;
    this._cover.setStyle('width',this._width+'px');
    this._cover.setStyle('height',this._height+'px');
    this._formatDiv(this._cover);
};

viewport._updateAllElements = function() {
    this._updateRealScale();
    this._updateErrorPrinter();
    this._updateCanvas();
    this._updateVideo();
    this._updateUpperCanvas();
    this._updateCover();
    this._updateRenderer();
};

viewport._createErrorPrinter = function() {
    this._errorPrinter = document.createElement('div');
    this._errorPrinter.style.display = 'flex';
    this._errorPrinter.id = 'ErrorPrinter';
    this._updateErrorPrinter();
    document.body.appendChild(this._errorPrinter);
};

viewport._createCanvas = function() {
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'GameCanvas';
    this._updateCanvas();
    document.body.appendChild(this._canvas);
};


viewport._createVideo = function() {
    this._video = document.createElement('video');
    this._video.id = 'GameVideo';
    this._video.style.opacity = 0;
    this._video.setAttribute('playsinline', '');
    this._video.volume = this._videoVolume;
    this._updateVideo();
    document.body.appendChild(this._video);
};


viewport._createCover = function(){
     this._cover = new Cover_Layer();
     this._cover.setId('gameCover');
     this._cover.setStyle('overflow','hidden');
    this._cover.setStyle('zIndex','5');
    this._cover.setStyle('transition','opacity 0.4s');
     this._updateCover();
     document.body.appendChild(this._cover._div);
};

viewport._createUpperCanvas = function() {
    this._upperCanvas = document.createElement('canvas');
    this._upperCanvas.id = 'UpperCanvas';
    this._upperCanvas.style.background = 'black';
    this._upperCanvas.style.opacity = '0';
    this._updateUpperCanvas();
    document.body.appendChild(this._upperCanvas);
};

viewport._createAllElements = function() {
    this._createErrorPrinter();
    this._createCanvas();
    // this._createVideo();
    this._createCover();
    this._createUpperCanvas();
};

viewport.updateFade = function(){
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

viewport.render = function(stage) {
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
};

viewport._makeErrorHtml = function(name, message) {
    return ('<p style="margin:auto;text-align:center;"><font color="yellow"><b>' + name + '</b></font><br>' +
        '<font color="white">' + message + '</font><br></p>');
};

viewport.printLoadingError = function(url) {
    if(!this._stopped)
        this.stop();
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
    }
};

viewport.eraseLoadingError = function() {
    if (this._errorPrinter && !this._errorShowed) {
        this._errorPrinter.innerHTML = '';
    }
};

viewport.printError = function(name, message) {
    this._errorShowed = true;
    if(!this._stopped)
        viewport.stop();
    if (this._errorPrinter) {
        this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
    }

};

viewport.printLoadingError = function(filename){
    if(!this._stopped)
        viewport.stop();
    this._errorShowed = true;
    if(this._errorPrinter){
        this._errorPrinter.innerHTML = this._makeErrorHtml('加载失败','资源加载失败'+filename+',请重新下载');
    }
};


viewport.preferableRendererType = function() {
    if (Utils.isOptionValid('canvas')) {
        return 'canvas';
    } else if (Utils.isOptionValid('webgl')) {
        return 'webgl';
    } else {
        return 'auto';
    }
};

viewport._testCanvasBlendModes = function() {
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


viewport._clearUpperCanvas = function() {
    var context = this._upperCanvas.getContext('2d');
    context.clearRect(0, 0, this._width, this._height);
};

viewport._createRenderer = function() {
    PIXI.dontSayHello = true;
    var width = this._width;
    var height = this._height;
    try {
        this._renderer = new PIXI.Renderer({width:width,height:height,view:this._canvas});
        if(this._renderer && this._renderer.textureGC)
            this._renderer.textureGC.maxIdle = 1;
        this._renderer.backgroundColor = 0x061639;
    } catch (e) {
        this._renderer = null;
    }
};

viewport._createFontLoader = function(name) {
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

viewport._disableTextSelection = function() {
    var body = document.body;
    body.style.userSelect = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.msUserSelect = 'none';
    body.style.mozUserSelect = 'none';
};

viewport._disableContextMenu = function() {
    var elements = document.body.getElementsByTagName('*');
    var oncontextmenu = function() { return false; };
    for (var i = 0; i < elements.length; i++) {
        elements[i].oncontextmenu = oncontextmenu;
    }
};

viewport._adjustOnBrowser = function(){
    if(Utils.isMobileSafari() && screen.width <= 560)
    {
        if(document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
            bodyTag = document.getElementsByTagName('body')[0];
            bodyTag.style.height = document.documentElement.clientWidth / screen.width * screen.height + 'px';
        }
    }
};

viewport._applyCanvasFilter = function() {
    if (this._canvas) {
        this._canvas.style.opacity = 0.5;
        this._canvas.style.filter = 'blur(8px)';
        this._canvas.style.webkitFilter = 'blur(8px)';
    }
};

viewport._setupEventHandlers = function() {
    window.addEventListener('resize', this._onWindowResize.bind(this));
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keydown', this._onTouchEnd.bind(this));
    document.addEventListener('mousedown', this._onTouchEnd.bind(this));
    document.addEventListener('touchend', this._onTouchEnd.bind(this));
};

viewport._onTouchEnd = function(event) {

};

viewport._onWindowResize = function() {
    this._updateAllElements();
};

viewport._onKeyDown = function(event) {
    if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
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

viewport._switchStretchMode = function() {
    this._stretchEnabled = !this._stretchEnabled;
    this._updateAllElements();
};

viewport._switchFullScreen = function() {
    if (this._isFullScreen()) {
        this._requestFullScreen();
    } else {
        this._cancelFullScreen();
    }
    this._updateRealScale();
};

viewport._requestFullScreen = function() {
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

viewport._cancelFullScreen = function() {
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

viewport.requestUpdate = function() {
    if (this._initialized) {
        requestAnimationFrame(this.update.bind(this));
    }
};

viewport.startLoading = function(){
   this._loading = true;
    if(this._cover)
        this._cover.setStyle('opacity','1');
};


viewport.updateLoading = function(){
    if(this._cover && this._cover.update)
        this._cover.update();
};

viewport.endLoading = function(){
    this._loading = false;
    if(this._cover)
        this._cover.setStyle('opacity','0');
};

viewport.stop = function(){
   this._stopped = true;
   if(this._cover)
       this._cover.pause();
    this._applyCanvasFilter();
    this._clearUpperCanvas();
};



viewport.update = function(){
    this.requestUpdate();
    if(this._stopped)
        return;
    if(this._loading)
        this.updateLoading();
    if(typeof PIXI != 'undefined' && !this._renderer)
        this._createRenderer();
    updateManager.getQueue().forEach(function(obj){
        if(obj.update)
            obj.update();
    });
};

viewport.initialize('canvas');

