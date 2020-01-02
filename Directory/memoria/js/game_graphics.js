/*********************
*       Point
*
* ********************/

function Point() {
    this.initialize.apply(this, arguments);
}

Point.prototype = Object.create(PIXI.Point.prototype);
Point.prototype.constructor = Point;

Point.prototype.initialize = function(x, y) {
    PIXI.Point.call(this, x, y);
};


/*****************
 *  Rectangle
 *
 *
 *
*******************/

function Rectangle(){
    this.initialize.apply(this,arguments);
};

Rectangle.prototype = Object.create(PIXI.Rectangle.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.initialize = function(x,y,width,height){
  PIXI.Rectangle.call(this,x,y,width,height);
};

Rectangle.emptyRectangle = new Rectangle(0,0,0,0);




/***************
 *  Bitmap
 *
 * *************/

function Bitmap(){
    this.initalize.apply(this,arguments);
};

Bitmap._reuseImages = [];

Bitmap.prototype._createCanvas = function(width,height){
  this.__canvas = this.__canvas || document.createElement('canvas');
  this.__context = this.__canvas.getContext('2d');

  this.__canvas.width = Math.max(width|| 0,1);
  this.__canvas.height = Math.max(height|| 0,1);

  if(this._image){
      var w = Math.max(this._image.width || 0,1);
      var h = Math.max(this._image.height || 0,1);
      this.__canvas.width = w;
      this.__canvas.height = h;
      this._createBaseTexture(this._canvas);

      this.__context.drawImage(this._image, 0, 0);
  };

  this._setDirty();
};

Bitmap.prototype._renewCanvas = function(){
    var newImage = this._image;
    if(newImage && this.__canvas && (this.__canvas.width < newImage.width || this.__canvas.height < newImage.height)){
        this._createCanvas();
    }
};


Bitmap.prototype._createBaseTexture = function(source){
  this._baseTexture = new PIXI.BaseTexture(source);
  this._baseTexture.mipmap = false;
  this._baseTexture.width = source.width;
  this._baseTexture.height = source.height;
};

Bitmap.prototype._clearImgInstance = function(){
  this._image.src = "";
  this._image.onload = null;
  this._image.onerror = null;
  this._errorListener = null;
  this._loadListener = null;

  Bitmap._reuseImage.push(this._image);
  this._image = null;
};

Object.defineProperties(Bitmap.prototype, {
    _canvas: {
        get: function(){
            if(!this.__canvas)this._createCanvas();
            return this.__canvas;
        }
    },
    _context: {
        get: function(){
            if(!this.__context)this._createCanvas();
            return this.__context;
        }
    },

    _baseTexture: {
        get: function(){
            if(!this.__baseTexture) this._createBaseTexture(this._image || this.__canvas);
            return this.__baseTexture;
        }
    }
});


Bitmap.prototype.initialize = function(width,height){
    if(!this._defer){
        this._createCanvas(width,height);
    }

    this._image = null;
    this._url = '';
    this._paintOpacity = 255;
    this._smooth = false;
    this._loadListeners = [];
    this._loadingState = 'none';
    this._decodeAfterRequest = false;

    this.cacheEntry = null;

    this.fontFace = appInfo.GameFont();

    this.fontSize = 28;

    this.fontItalic = false;

    this.textColor = '#ffffff';

    this.outlineColor = 'rgba(0,0,0,0.5)';

    this.outlineWidth =4;

};


Bitmap.load = function(url){
    var bitmap = Object.create(Bitmap.prototype);
    bitmap._defer = true;
    bitmap.initialize();

    bitmap._decodeAfterRequest = true;
    bitmap._requestImage(url);

    return bitmap;
};


Bitmap.snap = function(layer){
    var width = viewPort.getWidth();
    var height = viewPort.getHeight();

    var bitmap = new Bitmap(width,height);
    var context = bitmap._context;

    var renderTexture = PIXI.RenderTexture.create(width,height);

    if(layer){
        viewPort._renderer.render(layer,renderTexture);
        layer.worldTransform.identity();
        var canvas = null;
        if (Graphics.isWebGL()) {
            canvas = Graphics._renderer.extract.canvas(renderTexture);
        } else {
            canvas = renderTexture.baseTexture._canvasRenderTarget.canvas;
        }
        context.drawImage(canvas, 0, 0);
    } else {

    }
    renderTexture.destroy( {destroyBase: true } );
    bitmap._setDirty();
    return bitmap;
};

Bitmap.prototype.isReady = function(){
    return this._loadingState == 'loaded' || this._loadingState === 'none';
};


Bitmap.prototype.isError = function(){
  return this._loadingState == 'error';
};

Bitmap.prototype.touch = function(){
   if(this.cacheEntry){
       this.cacheEntry.touch();
   };
};

Object.defineProperty(Bitmap.prototype, 'url', {
    get: function() {
        return this._url;
    },
    configurable: true
});
