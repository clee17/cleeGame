var viewPort = function(){
    throw new Error('This is a static class');
};

viewPort.initialize = function(width, height){
    this._width = 1280 || width;
    this._height = 720 || height;
    this._renderType = 'auto';

    this._scale = 1;
    this._realScale = 1;

    this._rendered = false;

    this._stretchEnabled = true;

    this._canvas = null;
    this._upperCanvas = null;
    this._hiddenCanvas = null;
    this._errorPrinter = null;

    this._renderer = null;
    this._fpsMeter = null;

    this._loadingImage = null;

    this._loadingCount = 0;

    this._testCount = 0;

    this._initRenderType();
    this._updateRealScale();
    this._createAllElements();
    this._disableTextSelection();
    this._disableContextMenu();
    this._setupEventHandlers();
};

viewPort._deltaTime  = 1.0/60.0;

viewPort.tickStart = function(){
    if(this._fpsMeter)
        this._fpsMeter.tickStart();
};

viewPort.tickEnd = function(){
  if(this._fpsMeter && this._rendered){
      this._fpsMeter.tick();
  };
};

viewPort.render = function(stage){
    var startTime = Date.now();
    if(stage){
        this._renderer.render(stage);
    }
    var endTime = Date.now();
    var elapsed = endTime - startTime;

    this.frameCount++;
};

viewPort._initRenderType = function(){
    this._renderType = this.preferableRendererType();
};

viewPort.isInsideCanvas = function(x,y){
    return (x >= 0 && x < this._width && y >= 0 && y < this._height);
};

viewPort.pageToCanvasX = function(x){
  if(this._canvas){
      var left = this._canvas.offsetLeft;
      return Math.round((x-left)/this._realScale);
  }
  else {
      return 0;
  }
};

viewPort.pageToCanvasY = function(y){
  if(this._canbas){
      var top = this._canvas.offsetTop;
      return Math.round((y-top)/this._realScale);
  }  else{
      return 0;
  }
};

Object.defineProperty(viewPort, 'width', {
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

Object.defineProperty(viewPort, 'height', {
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


Object.defineProperty(viewPort, 'scale', {
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

viewPort._disableTextSelection= function(){
    var body = document.body;
    body.style.userSelect = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.msUserSelect = 'none';
    body.style.mozeUserSelect = 'none';
};

viewPort._disableContextMenu = function(){
  var elements = document.body.getElementsByTagName('*');
  var contextmenu = function(){return false;};
  for (var i=0;i < elements.length;++i){
      elements[i].oncontextmenu = contextmenu;
  }
};

/*
*
*  create All elements
*
* */
viewPort._createAllElements = function() {
    this._createErrorPrinter();  //创建一个用于输出error printer的元素，id=error printer, 性质为段落<p>，各项显示属性也完成；
    this._createCanvas();  // 在body元素上创建一张画布，并为其预设格式，性质为"canvas"；
    this._createRenderer();
    this._createFPSMeter();
};

viewPort._createErrorPrinter = function(){
    this._errorPrinter = document.createElement('p');
    this._errorPrinter.id = 'ErrorPrinter';         //创建一个HTML元素errorprinter,性质为<p>
    this._updateErrorPrinter();          //给errorprinter的显示设定格式，字体，宽度，高度，对齐方式等等；
    document.body.appendChild(this._errorPrinter);
};

viewPort._createCanvas = function(){
    console.log('create Canvases');
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'GameCanvas';

    this._upperCanvas = document.createElement('canvas');
    this._upperCanvas.id = 'UpperCanvas';
    //上层画布大小与graphics等值，zindex为3；同时将upper canvas的值绘制在屏幕中央；

    document.body.appendChild(this._canvas);
    document.body.appendChild(this._upperCanvas);

    this._updateCanvas();
    this._updateUpperCanvas();
};

viewPort._createRenderer = function() {
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
    } catch (e) {
        this._renderer = null;
    }
};

viewPort._createFPSMeter = function() {
    // var options = { graph: 1, decimals: 0, theme: 'transparent', toggleOn: null };
    // this._fpsMeter = new FPSMeter(options);
    // this._fpsMeter.hide();
};


/*
*
*  modify the view of the canvas;
*
* */

viewPort._applyCanvasFilter = function() {
    if (this._canvas) {
        this._canvas.style.opacity = 0.5;         //绘图属性透明度降低到0.5；
        this._canvas.style.filter = 'blur(8px)';     //修改图片的显示方式为模糊，标准语法；
        this._canvas.style.webkitFilter = 'blur(8px)'; //针对chrome, safari和opera浏览器的语法；
    }
};


//add listener events;
viewPort._setupEventHandlers = function() {
    window.addEventListener('resize', this._onWindowResize.bind(this));
    // document.addEventListener('keydown', this._onKeyDown.bind(this));
};

viewPort._onWindowResize = function() {
    this._updateAllElements();
};

viewPort._onKeyDown = function(event) {
    if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
            case 113:   // F2
                event.preventDefault();
                // this._switchFPSMeter();
                break;
            case 114:   // F3
                event.preventDefault();
                // this._switchStretchMode();
                break;
            case 115:   // F4
                event.preventDefault();
                this._switchFullScreen();
                break;
        }
    }
};

/*
*
*  Resize the screen;
*
* */

viewPort._switchFullScreen = function() {
    if (this._isFullScreen()) {
        this._requestFullScreen();
    } else {
        this._cancelFullScreen();
    }
};

viewPort._isFullScreen = function() {
    return ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitFullscreenElement &&
            !document.msFullscreenElement));
};

//若浏览器支持全屏，和退出全屏，则全屏和退出全屏化；

viewPort._requestFullScreen = function() {
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

//若浏览器支持全屏，和退出全屏，则全屏和退出全屏化；
viewPort._cancelFullScreen = function() {
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

/*
*
* update All elements
*
* */

viewPort._updateAllElements = function() {
    this._updateRealScale();
    this._updateCanvas();
    this._updateUpperCanvas();
    this._updateRenderer();
    this._paintUpperCanvas();
};

viewPort._updateRealScale = function() {
    if (this._stretchEnabled) {                            //如果画面允许拉升的话；
        var h = window.innerWidth / this._width;
        var v = window.innerHeight / this._height;
        this._realScale = Math.min(h, v);                 //实际显示的土相应当按照比例比较短的一边拉升填满；
    } else {
        this._realScale = this._scale;                 //不允许拉升的话，则实际显示等于原始图像；
    }
};

viewPort._updateCanvas = function() {
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._canvas.style.zIndex = 1;
    this._centerElement(this._canvas);
};

viewPort._updateUpperCanvas = function() {
    this._upperCanvas.width = this._width;
    this._upperCanvas.height = this._height;
    this._upperCanvas.style.zIndex = 3;
    this._centerElement(this._upperCanvas);
};

viewPort._updateRenderer = function(){
    if(this._renderer)
        this._renderer.resize(this._width,this._height);
};

viewPort._updateErrorPrinter = function() {
    this._errorPrinter.width = this._width * 0.9;
    this._errorPrinter.height = 40;
    this._errorPrinter.style.textAlign = 'center';
    this._errorPrinter.style.textShadow = '1px 1px 3px #000';
    this._errorPrinter.style.fontSize = '20px';
    this._errorPrinter.style.zIndex = 99;
    this._centerElement(this._errorPrinter);
//center element的作用时将全部元素共享的格式进行统一规定，包括边框为0，对齐方式为absolute，等；每个元素不同的设定则在update中完成；
};

viewPort._paintUpperCanvas = function() {
    var context = this._upperCanvas.getContext('2d');         //创建一个绘图区域；
    context.clearRect(0, 0, this._width, this._height);       //清空upper Canvas元素中的画面；
    if (this._loadingImage && this._loadingCount >= 20) {
        var context = this._upperCanvas.getContext('2d');
        var dx = (this._width - this._loadingImage.width) / 2;
        var dy = (this._height - this._loadingImage.height) / 2;
        var alpha = ((this._loadingCount - 20) / 30).clamp(0, 1);
        context.save();
        context.globalAlpha = alpha;
        context.drawImage(this._loadingImage, dx, dy);
        context.restore();
    }
};


viewPort._centerElement = function(element) {
   var width = element.width * this._realScale;          //根据缩放比例调整元素大小；
    var height = element.height * this._realScale;       //根据缩放比例调整元素大小；
    element.style.position = 'absolute';
    element.style.margin = 'auto';
    element.style.top = 0;
    element.style.left = 0;
    element.style.right = 0;
    element.style.bottom = 0;
    element.style.width = width + 'px';
    element.style.height = height + 'px';
};

viewPort.preferableRendererType = function() {
    console.log(location.search.slice(1).split('&'));
    if (appinfo.isOptionValid('canvas')) {           //检测所在位置，如果是手机则渲染type为手机；
        return 'canvas';
    } else if (appinfo.isOptionValid('webgl')) {     //推测有可能是网页版的渲染方法；
        return 'webgl';
    } else if (appinfo.isMobileDevice()){     //如果是手机平台则必须用canvas渲染；
        return 'canvas';
    } else {
        return 'auto';
    }
};

viewPort.getWidth = function(){
    return this._canvas.width;
};

viewPort.getHeight = function(){
    return this._canvas.height;
};

viewPort.getRealWidth = function(){
    return this._canvas.width/this._realScale;
};

viewPort.getRealWidth = function(){
    return this._canvas.height/this._realScale;
};

viewPort.initView = function(){
  this.initialize(appinfo._screenWidth,appinfo._screenHeight);
};

console.log('finsihed loading app core');