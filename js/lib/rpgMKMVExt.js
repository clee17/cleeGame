function $system(){
    throw 'this is a static class';
}

$system.initialize = function(){
    $system.initialized = false;
    $system.data = {};
    loader.getSystemInfo(function(results){
        $system.initialized = true;
        for(let i=0; i<results.length;++i){
            let result = results[i];
            $system[result.name] = result.val;
            if(result[i].type === 'Json')
                $system[result.name] = JSON.parse(result.val);
        }
        loader.clearCache('info');
    });
};

$system.sounds = function(n){
    if(n === undefined)
        return null;
    if(!$system.sounds)
        return null;
    return $system.sounds[n];
};

viewport.pageToCanvasX = function(x){
    if (this._canvas) {
        let left = this._canvas.offsetLeft;
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

viewport.canUseDifferenceBlend = function() {
    return this._canUseDifferenceBlend;
};

viewport.canUseSaturationBlend = function() {
    return this._canUseSaturationBlend;
};


function CacheEntry(cache, key, item) {
    this.cache = cache;
    this.key = key;
    this.item = item;
    this.cached = false;
    this.touchTicks = 0;
    this.touchSeconds = 0;
    this.ttlTicks = 0;
    this.ttlSeconds = 0;
    this.freedByTTL = false;
}

CacheEntry.prototype.free = function (byTTL) {
    this.freedByTTL = byTTL || false;
    if (this.cached) {
        this.cached = false;
        delete this.cache._inner[this.key];
    }
};

CacheEntry.prototype.allocate = function () {
    if (!this.cached) {
        this.cache._inner[this.key] = this;
        this.cached = true;
    }
    this.touch();
    return this;
};

CacheEntry.prototype.setTimeToLive = function (ticks, seconds) {
    this.ttlTicks = ticks || 0;
    this.ttlSeconds = seconds || 0;
    return this;
};

CacheEntry.prototype.isStillAlive = function () {
    var cache = this.cache;
    return ((this.ttlTicks == 0) || (this.touchTicks + this.ttlTicks < cache.updateTicks )) &&
        ((this.ttlSeconds == 0) || (this.touchSeconds + this.ttlSeconds < cache.updateSeconds ));
};

CacheEntry.prototype.touch = function () {
    var cache = this.cache;
    if (this.cached) {
        this.touchTicks = cache.updateTicks;
        this.touchSeconds = cache.updateSeconds;
    } else if (this.freedByTTL) {
        this.freedByTTL = false;
        if (!cache._inner[this.key]) {
            cache._inner[this.key] = this;
        }
    }
};

function CacheMap(manager) {
    this.manager = manager;
    this._inner = {};
    this._lastRemovedEntries = {};
    this.updateTicks = 0;
    this.lastCheckTTL = 0;
    this.delayCheckTTL = 100.0;
    this.updateSeconds = Date.now();
}

CacheMap.prototype.checkTTL = function () {
    var cache = this._inner;
    var temp = this._lastRemovedEntries;
    if (!temp) {
        temp = [];
        this._lastRemovedEntries = temp;
    }
    for (var key in cache) {
        var entry = cache[key];
        if (!entry.isStillAlive()) {
            temp.push(entry);
        }
    }
    for (var i = 0; i < temp.length; i++) {
        temp[i].free(true);
    }
    temp.length = 0;
};

CacheMap.prototype.getItem = function (key) {
    var entry = this._inner[key];
    if (entry) {
        return entry.item;
    }
    return null;
};

CacheMap.prototype.clear = function () {
    var keys = Object.keys(this._inner);
    for (var i = 0; i < keys.length; i++) {
        this._inner[keys[i]].free();
    }
};

CacheMap.prototype.setItem = function (key, item) {
    return new CacheEntry(this, key, item).allocate();
};

CacheMap.prototype.update = function(ticks, delta) {
    this.updateTicks += ticks;
    this.updateSeconds += delta;
    if (this.updateSeconds >= this.delayCheckTTL + this.lastCheckTTL) {
        this.lastCheckTTL = this.updateSeconds;
        this.checkTTL();
    }
};

function ImageCache(){
    this.initialize.apply(this, arguments);
}

ImageCache.limit = 10 * 1000 * 1000;

ImageCache.prototype.initialize = function(){
    this._items = {};
};

ImageCache.prototype.add = function(key, value){
    this._items[key] = {
        bitmap: value,
        touch: Date.now(),
        key: key
    };

    this._truncateCache();
};

ImageCache.prototype.get = function(key){
    if(this._items[key]){
        var item = this._items[key];
        item.touch = Date.now();
        return item.bitmap;
    }

    return null;
};

ImageCache.prototype.reserve = function(key, value, reservationId){
    if(!this._items[key]){
        this._items[key] = {
            bitmap: value,
            touch: Date.now(),
            key: key
        };
    }

    this._items[key].reservationId = reservationId;
};

ImageCache.prototype.releaseReservation = function(reservationId){
    var items = this._items;

    Object.keys(items)
        .map(function(key){return items[key];})
        .forEach(function(item){
            if(item.reservationId === reservationId){
                delete item.reservationId;
            }
        });
};

ImageCache.prototype._truncateCache = function(){
    var items = this._items;
    var sizeLeft = ImageCache.limit;

    Object.keys(items).map(function(key){
        return items[key];
    }).sort(function(a, b){
        return b.touch - a.touch;
    }).forEach(function(item){
        if(sizeLeft > 0 || this._mustBeHeld(item)){
            var bitmap = item.bitmap;
            sizeLeft -= bitmap.width * bitmap.height;
        }else{
            delete items[item.key];
        }
    }.bind(this));
};

ImageCache.prototype._mustBeHeld = function(item){
    if(item.reservationId) return true;
    if(!item.bitmap.isReady()) return true;
    return false;
};

ImageCache.prototype.isReady = function(){
    var items = this._items;
    return !Object.keys(items).some(function(key){
        return !items[key].bitmap.isReady();
    });

};

ImageCache.prototype.getErrorBitmap = function(){
    var items = this._items;
    var bitmap = null;
    if(Object.keys(items).some(function(key){
        if(items[key].bitmap.isError()){
            bitmap = items[key].bitmap;
            return true;
        }
        return false;
    })) {
        return bitmap;
    }

    return null;
};


function RequestQueue(){
    this.initialize.apply(this, arguments);
}

RequestQueue.prototype.initialize = function(){
    this._queue = [];
};

RequestQueue.prototype.enqueue = function(key, value){
    this._queue.push({
        key: key,
        value: value,
    });
};

RequestQueue.prototype.update = function(){
    if(this._queue.length === 0) return;
    var top = this._queue[0];
    if(top.value.isRequestReady()){
        this._queue.shift();
        if(this._queue.length !== 0){
            this._queue[0].value.startRequest();
        }
    }else{
        top.value.startRequest();
    }
};

RequestQueue.prototype.raisePriority = function(key){
    for(var n = 0; n < this._queue.length; n++){
        var item = this._queue[n];
        if(item.key === key){
            this._queue.splice(n, 1);
            this._queue.unshift(item);
            break;
        }
    }
};

RequestQueue.prototype.clear = function(){
    this._queue.splice(0);
};

function Point() {
    this.initialize.apply(this, arguments);
}

Point.prototype = Object.create(PIXI.Point.prototype);
Point.prototype.constructor = Point;

Point.prototype.initialize = function(x, y) {
    PIXI.Point.call(this, x, y);
};

function Rectangle() {
    this.initialize.apply(this, arguments);
}

Rectangle.prototype = Object.create(PIXI.Rectangle.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.initialize = function(x, y, width, height) {
    PIXI.Rectangle.call(this, x, y, width, height);
};

Rectangle.emptyRectangle = new Rectangle(0, 0, 0, 0);

function Bitmap() {
    this.initialize.apply(this, arguments);
}

Bitmap._reuseImages = [];

Bitmap.prototype._createCanvas = function(width, height){
    this.__canvas = this.__canvas || document.createElement('canvas');
    this.__context = this.__canvas.getContext('2d');

    this.__canvas.width = Math.max(width || 0, 1);
    this.__canvas.height = Math.max(height || 0, 1);

    if(this._image){
        var w = Math.max(this._image.width || 0, 1);
        var h = Math.max(this._image.height || 0, 1);
        this.__canvas.width = w;
        this.__canvas.height = h;
        this._createBaseTexture(this._canvas);

        this.__context.drawImage(this._image, 0, 0);
    }

    this._setDirty();
};

Bitmap.prototype._createBaseTexture = function(source){
    this.__baseTexture = new PIXI.BaseTexture(source);
    this.__baseTexture.mipmap = false;
    this.__baseTexture.width = source.width;
    this.__baseTexture.height = source.height;

    if (this._smooth) {
        this._baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
    } else {
        this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
};

Bitmap.prototype._clearImgInstance = function(){
    this._image.src = "";
    this._image.onload = null;
    this._image.onerror = null;
    this._errorListener = null;
    this._loadListener = null;

    Bitmap._reuseImages.push(this._image);
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

Bitmap.prototype._renewCanvas = function(){
    var newImage = this._image;
    if(newImage && this.__canvas && (this.__canvas.width < newImage.width || this.__canvas.height < newImage.height)){
        this._createCanvas();
    }
};

Bitmap.prototype.initialize = function(width, height) {
    if(!this._defer){
        this._createCanvas(width, height);
    }

    this._image = null;
    this._url = '';
    this._paintOpacity = 255;
    this._smooth = false;
    this._loadListeners = [];
    this._loadingState = 'none';
    this._decodeAfterRequest = false;
    this.cacheEntry = null;
    this.fontFace = 'GameFont';
    this.fontSize = 28;
    this.fontItalic = false;
    this.textColor = '#ffffff';
    this.outlineColor = 'rgba(0, 0, 0, 0.5)';
    this.outlineWidth = 4;
};

Bitmap.load = function() {
    var bitmap = Object.create(Bitmap.prototype);
    bitmap._defer = true;
    bitmap.initialize();
    if(Bitmap._reuseImages.length !== 0){
        bitmap._image = Bitmap._reuseImages.pop();
    }else{
        bitmap._image = new Image();
    }
    return bitmap;
};

Bitmap.snap = function(stage) {
    var width = viewport.width;
    var height = viewport.height;
    var bitmap = new Bitmap(width, height);
    var context = bitmap._context;
    var renderTexture = PIXI.RenderTexture.create(width, height);
    if (stage) {
        viewport._renderer.render(stage, renderTexture);
        stage.worldTransform.identity();
        var canvas = null;
        if (viewport.isWebGL()) {
            canvas = viewport._renderer.extract.canvas(renderTexture);
        } else {
            canvas = renderTexture.baseTexture._canvasRenderTarget.canvas;
        }
        context.drawImage(canvas, 0, 0);
    } else {

    }
    renderTexture.destroy({ destroyBase: true });
    bitmap._setDirty();
    return bitmap;
};

Bitmap.prototype.isReady = function() {
    return this._loadingState === 'loaded';
};

Bitmap.prototype.isError = function() {
    return this._loadingState === 'error';
};


Bitmap.prototype.touch = function() {
    if (this.cacheEntry) {
        this.cacheEntry.touch();
    }
};

Object.defineProperty(Bitmap.prototype, 'url', {
    get: function() {
        return this._url;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'baseTexture', {
    get: function() {
        return this._baseTexture;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'canvas', {
    get: function() {
        return this._canvas;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'context', {
    get: function() {
        return this._context;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'width', {
    get: function() {
        if(this.isReady()){
            return this._image? this._image.width: this._canvas.width;
        }

        return 0;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'height', {
    get: function() {
        if(this.isReady()){
            return this._image? this._image.height: this._canvas.height;
        }

        return 0;
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'rect', {
    get: function() {
        return new Rectangle(0, 0, this.width, this.height);
    },
    configurable: true
});

Object.defineProperty(Bitmap.prototype, 'smooth', {
    get: function() {
        return this._smooth;
    },
    set: function(value) {
        if (this._smooth !== value) {
            this._smooth = value;
            if(this.__baseTexture){
                if (this._smooth) {
                    this._baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
                } else {
                    this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                }
            }
        }
    },
    configurable: true
});


Object.defineProperty(Bitmap.prototype, 'paintOpacity', {
    get: function() {
        return this._paintOpacity;
    },
    set: function(value) {
        if (this._paintOpacity !== value) {
            this._paintOpacity = value;
            this._context.globalAlpha = this._paintOpacity / 255;
        }
    },
    configurable: true
});

Bitmap.prototype.resize = function(width, height) {
    width = Math.max(width || 0, 1);
    height = Math.max(height || 0, 1);
    this._canvas.width = width;
    this._canvas.height = height;
    this._baseTexture.width = width;
    this._baseTexture.height = height;
};

Bitmap.prototype.blt = function(source, sx, sy, sw, sh, dx, dy, dw, dh) {
    dw = dw || sw;
    dh = dh || sh;
    if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 &&
        sx + sw <= source.width && sy + sh <= source.height) {
        this._context.globalCompositeOperation = 'source-over';
        this._context.drawImage(source._canvas, sx, sy, sw, sh, dx, dy, dw, dh);
        this._setDirty();
    }
};

Bitmap.prototype.bltImage = function(source, sx, sy, sw, sh, dx, dy, dw, dh) {
    dw = dw || sw;
    dh = dh || sh;
    if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 &&
        sx + sw <= source.width && sy + sh <= source.height) {
        this._context.globalCompositeOperation = 'source-over';
        this._context.drawImage(source._image, sx, sy, sw, sh, dx, dy, dw, dh);
        this._setDirty();
    }
};

Bitmap.prototype.getPixel = function(x, y) {
    var data = this._context.getImageData(x, y, 1, 1).data;
    var result = '#';
    for (var i = 0; i < 3; i++) {
        result += data[i].toString(16).padZero(2);
    }
    return result;
};

Bitmap.prototype.getAlphaPixel = function(x, y) {
    var data = this._context.getImageData(x, y, 1, 1).data;
    return data[3];
};


function WindowLayer() {
    this.initialize.apply(this, arguments);
}

WindowLayer.prototype = Object.create(PIXI.Container.prototype);
WindowLayer.prototype.constructor = WindowLayer;

WindowLayer.prototype.initialize = function() {
    PIXI.Container.call(this);
    this._width = 0;
    this._height = 0;
    this._tempCanvas = null;
    this._translationMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    this._windowMask = new PIXI.Graphics();
    this._windowMask.beginFill(0xffffff, 1);
    this._windowMask.drawRect(0, 0, 0, 0);
    this._windowMask.endFill();
    this._windowRect = this._windowMask.graphicsData[0].shape;

    this._renderSprite = null;
    this.filterArea = new PIXI.Rectangle();
    this.filters = [];

    //temporary fix for memory leak bug
    this.on('removed', this.onRemoveAsAChild);
};

WindowLayer.prototype.onRemoveAsAChild = function() {
    this.removeChildren();
}

Object.defineProperty(WindowLayer.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        this._width = value;
    },
    configurable: true
});

Object.defineProperty(WindowLayer.prototype, 'height', {
    get: function() {
        return this._height;
    },
    set: function(value) {
        this._height = value;
    },
    configurable: true
});

WindowLayer.prototype.move = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

WindowLayer.prototype.update = function() {
    this.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};

WindowLayer.prototype.renderCanvas = function(renderer) {
    if (!this.visible || !this.renderable) {
        return;
    }

    if (!this._tempCanvas) {
        this._tempCanvas = document.createElement('canvas');
    }

    this._tempCanvas.width = viewport.width;
    this._tempCanvas.height = viewport.height;

    var realCanvasContext = renderer.context;
    var context = this._tempCanvas.getContext('2d');

    context.save();
    context.clearRect(0, 0, viewport.width, viewport.height);
    context.beginPath();
    context.rect(this.x, this.y, this.width, this.height);
    context.closePath();
    context.clip();

    renderer.context = context;

    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child._isWindow && child.visible && child.openness > 0) {
            this._canvasClearWindowRect(renderer, child);
            context.save();
            child.renderCanvas(renderer);
            context.restore();
        }
    }

    context.restore();

    renderer.context = realCanvasContext;
    renderer.context.setTransform(1, 0, 0, 1, 0, 0);
    renderer.context.globalCompositeOperation = 'source-over';
    renderer.context.globalAlpha = 1;
    renderer.context.drawImage(this._tempCanvas, 0, 0);

    for (var j = 0; j < this.children.length; j++) {
        if (!this.children[j]._isWindow) {
            this.children[j].renderCanvas(renderer);
        }
    }
};


WindowLayer.prototype._canvasClearWindowRect = function(renderSession, window) {
    var rx = this.x + window.x;
    var ry = this.y + window.y + window.height / 2 * (1 - window._openness / 255);
    var rw = window.width;
    var rh = window.height * window._openness / 255;
    renderSession.context.clearRect(rx, ry, rw, rh);
};

WindowLayer.prototype.renderWebGL = function(renderer) {
    if (!this.visible || !this.renderable) {
        return;
    }

    if (this.children.length==0) {
        return;
    }

    renderer.flush();
    this.filterArea.copy(this);
    renderer.filterManager.pushFilter(this, this.filters);
    renderer.currentRenderer.start();

    var shift = new PIXI.Point();
    var rt = renderer._activeRenderTarget;
    var projectionMatrix = rt.projectionMatrix;
    shift.x = Math.round((projectionMatrix.tx + 1) / 2 * rt.sourceFrame.width);
    shift.y = Math.round((projectionMatrix.ty + 1) / 2 * rt.sourceFrame.height);

    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child._isWindow && child.visible && child.openness > 0) {
            this._maskWindow(child, shift);
            renderer.maskManager.pushScissorMask(this, this._windowMask);
            renderer.clear();
            renderer.maskManager.popScissorMask();
            renderer.currentRenderer.start();
            child.renderWebGL(renderer);
            renderer.currentRenderer.flush();
        }
    }

    renderer.flush();
    renderer.filterManager.popFilter();
    renderer.maskManager.popScissorMask();

    for (var j = 0; j < this.children.length; j++) {
        if (!this.children[j]._isWindow) {
            this.children[j].renderWebGL(renderer);
        }
    }
};

WindowLayer.prototype._maskWindow = function(window, shift) {
    this._windowMask._currentBounds = null;
    this._windowMask.boundsDirty = true;
    var rect = this._windowRect;
    rect.x = this.x + shift.x + window.x;
    rect.y = this.x + shift.y + window.y + window.height / 2 * (1 - window._openness / 255);
    rect.width = window.width;
    rect.height = window.height * window._openness / 255;
};



function ToneFilter() {
    PIXI.filters.ColorMatrixFilter.call(this);
}

ToneFilter.prototype = Object.create(PIXI.filters.ColorMatrixFilter.prototype);
ToneFilter.prototype.constructor = ToneFilter;


ToneFilter.prototype.adjustHue = function(value) {
    this.hue(value, true);
};


ToneFilter.prototype.adjustSaturation = function(value) {
    value = (value || 0).clamp(-255, 255) / 255;
    this.saturate(value, true);
};


ToneFilter.prototype.adjustTone = function(r, g, b) {
    r = (r || 0).clamp(-255, 255) / 255;
    g = (g || 0).clamp(-255, 255) / 255;
    b = (b || 0).clamp(-255, 255) / 255;

    if (r !== 0 || g !== 0 || b !== 0) {
        var matrix = [
            1, 0, 0, r, 0,
            0, 1, 0, g, 0,
            0, 0, 1, b, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, true);
    }
};


function ToneSprite() {
    this.initialize.apply(this, arguments);
}

ToneSprite.prototype = Object.create(PIXI.Container.prototype);
ToneSprite.prototype.constructor = ToneSprite;

ToneSprite.prototype.initialize = function() {
    PIXI.Container.call(this);
    this.clear();
};

ToneSprite.prototype.clear = function() {
    this._red = 0;
    this._green = 0;
    this._blue = 0;
    this._gray = 0;
};


ToneSprite.prototype.setTone = function(r, g, b, gray) {
    this._red = Math.round(r || 0).clamp(-255, 255);
    this._green = Math.round(g || 0).clamp(-255, 255);
    this._blue = Math.round(b || 0).clamp(-255, 255);
    this._gray = Math.round(gray || 0).clamp(0, 255);
};

ToneSprite.prototype._renderCanvas = function(renderer) {
    if (this.visible) {
        var context = renderer.context;
        var t = this.worldTransform;
        var r = renderer.resolution;
        var width = viewport.width;
        var height = viewport.height;
        context.save();
        context.setTransform(t.a, t.b, t.c, t.d, t.tx * r, t.ty * r);
        if (viewport.canUseSaturationBlend() && this._gray > 0) {
            context.globalCompositeOperation = 'saturation';
            context.globalAlpha = this._gray / 255;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
        }
        context.globalAlpha = 1;
        var r1 = Math.max(0, this._red);
        var g1 = Math.max(0, this._green);
        var b1 = Math.max(0, this._blue);
        if (r1 || g1 || b1) {
            context.globalCompositeOperation = 'lighter';
            context.fillStyle = Utils.rgbToCssColor(r1, g1, b1);
            context.fillRect(0, 0, width, height);
        }
        if (viewport.canUseDifferenceBlend()) {
            var r2 = Math.max(0, -this._red);
            var g2 = Math.max(0, -this._green);
            var b2 = Math.max(0, -this._blue);
            if (r2 || g2 || b2) {
                context.globalCompositeOperation = 'difference';
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, width, height);
                context.globalCompositeOperation = 'lighter';
                context.fillStyle = Utils.rgbToCssColor(r2, g2, b2);
                context.fillRect(0, 0, width, height);
                context.globalCompositeOperation = 'difference';
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, width, height);
            }
        }
        context.restore();
    }
};

ToneSprite.prototype._renderWebGL = function(renderer) {
    // Not supported
};

function ResourceHandler() {
    throw new Error('This is a static class');
}

ResourceHandler._reloaders = [];
ResourceHandler._defaultRetryInterval = [500, 1000, 3000];

ResourceHandler.createLoader = function(url, retryMethod, resignMethod, retryInterval) {
    retryInterval = retryInterval || this._defaultRetryInterval;
    var reloaders = this._reloaders;
    var retryCount = 0;
    return function() {
        if (retryCount < retryInterval.length) {
            setTimeout(retryMethod, retryInterval[retryCount]);
            retryCount++;
        } else {
            if (resignMethod) {
                resignMethod();
            }
            if (url) {
                if (reloaders.length === 0) {
                    viewport.printLoadingError(url);
                    viewport.stop();
                }
                reloaders.push(function() {
                    retryCount = 0;
                    retryMethod();
                });
            }
        }
    };
};

ResourceHandler.exists = function() {
    return this._reloaders.length > 0;
};

ResourceHandler.retry = function() {
    if (this._reloaders.length > 0) {
        viewport.printLoadingError();
        SceneManager.resume();
        this._reloaders.forEach(function(reloader) {
            reloader();
        });
        this._reloaders.length = 0;
    }
};


Bitmap.prototype.clearRect = function(x, y, width, height) {
    this._context.clearRect(x, y, width, height);
    this._setDirty();
};

Bitmap.prototype.clear = function() {
    this.clearRect(0, 0, this.width, this.height);
};

Bitmap.prototype.fillRect = function(x, y, width, height, color) {
    var context = this._context;
    context.save();
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
    context.restore();
    this._setDirty();
};

Bitmap.prototype.fillAll = function(color) {
    this.fillRect(0, 0, this.width, this.height, color);
};

Bitmap.prototype.gradientFillRect = function(x, y, width, height, color1,
                                             color2, vertical) {
    var context = this._context;
    var grad;
    if (vertical) {
        grad = context.createLinearGradient(x, y, x, y + height);
    } else {
        grad = context.createLinearGradient(x, y, x + width, y);
    }
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    context.save();
    context.fillStyle = grad;
    context.fillRect(x, y, width, height);
    context.restore();
    this._setDirty();
};

Bitmap.prototype.drawCircle = function(x, y, radius, color) {
    var context = this._context;
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.fill();
    context.restore();
    this._setDirty();
};

Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {

    if (text !== undefined) {
        var tx = x;
        var ty = y + lineHeight - (lineHeight - this.fontSize * 0.7) / 2;
        var context = this._context;
        var alpha = context.globalAlpha;
        maxWidth = maxWidth || 0xffffffff;
        if (align === 'center') {
            tx += maxWidth / 2;
        }
        if (align === 'right') {
            tx += maxWidth;
        }
        context.save();
        context.font = this._makeFontNameText();
        context.textAlign = align;
        context.textBaseline = 'alphabetic';
        context.globalAlpha = 1;
        this._drawTextOutline(text, tx, ty, maxWidth);
        context.globalAlpha = alpha;
        this._drawTextBody(text, tx, ty, maxWidth);
        context.restore();
        this._setDirty();
    }
};

Bitmap.prototype.measureTextWidth = function(text) {
    var context = this._context;
    context.save();
    context.font = this._makeFontNameText();
    var width = context.measureText(text).width;
    context.restore();
    return width;
};

Bitmap.prototype.adjustTone = function(r, g, b) {
    if ((r || g || b) && this.width > 0 && this.height > 0) {
        var context = this._context;
        var imageData = context.getImageData(0, 0, this.width, this.height);
        var pixels = imageData.data;
        for (var i = 0; i < pixels.length; i += 4) {
            pixels[i + 0] += r;
            pixels[i + 1] += g;
            pixels[i + 2] += b;
        }
        context.putImageData(imageData, 0, 0);
        this._setDirty();
    }
};

Bitmap.prototype.rotateHue = function(offset) {
    function rgbToHsl(r, g, b) {
        var cmin = Math.min(r, g, b);
        var cmax = Math.max(r, g, b);
        var h = 0;
        var s = 0;
        var l = (cmin + cmax) / 2;
        var delta = cmax - cmin;

        if (delta > 0) {
            if (r === cmax) {
                h = 60 * (((g - b) / delta + 6) % 6);
            } else if (g === cmax) {
                h = 60 * ((b - r) / delta + 2);
            } else {
                h = 60 * ((r - g) / delta + 4);
            }
            s = delta / (255 - Math.abs(2 * l - 255));
        }
        return [h, s, l];
    }

    function hslToRgb(h, s, l) {
        var c = (255 - Math.abs(2 * l - 255)) * s;
        var x = c * (1 - Math.abs((h / 60) % 2 - 1));
        var m = l - c / 2;
        var cm = c + m;
        var xm = x + m;

        if (h < 60) {
            return [cm, xm, m];
        } else if (h < 120) {
            return [xm, cm, m];
        } else if (h < 180) {
            return [m, cm, xm];
        } else if (h < 240) {
            return [m, xm, cm];
        } else if (h < 300) {
            return [xm, m, cm];
        } else {
            return [cm, m, xm];
        }
    }

    if (offset && this.width > 0 && this.height > 0) {
        offset = ((offset % 360) + 360) % 360;
        var context = this._context;
        var imageData = context.getImageData(0, 0, this.width, this.height);
        var pixels = imageData.data;
        for (var i = 0; i < pixels.length; i += 4) {
            var hsl = rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);
            var h = (hsl[0] + offset) % 360;
            var s = hsl[1];
            var l = hsl[2];
            var rgb = hslToRgb(h, s, l);
            pixels[i + 0] = rgb[0];
            pixels[i + 1] = rgb[1];
            pixels[i + 2] = rgb[2];
        }
        context.putImageData(imageData, 0, 0);
        this._setDirty();
    }
};

Bitmap.prototype.blur = function() {
    for (var i = 0; i < 2; i++) {
        var w = this.width;
        var h = this.height;
        var canvas = this._canvas;
        var context = this._context;
        var tempCanvas = document.createElement('canvas');
        var tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = w + 2;
        tempCanvas.height = h + 2;
        tempContext.drawImage(canvas, 0, 0, w, h, 1, 1, w, h);
        tempContext.drawImage(canvas, 0, 0, w, 1, 1, 0, w, 1);
        tempContext.drawImage(canvas, 0, 0, 1, h, 0, 1, 1, h);
        tempContext.drawImage(canvas, 0, h - 1, w, 1, 1, h + 1, w, 1);
        tempContext.drawImage(canvas, w - 1, 0, 1, h, w + 1, 1, 1, h);
        context.save();
        context.fillStyle = 'black';
        context.fillRect(0, 0, w, h);
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = 1 / 9;
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                context.drawImage(tempCanvas, x, y, w, h, 0, 0, w, h);
            }
        }
        context.restore();
    }
    this._setDirty();
};

Bitmap.prototype.addLoadListener = function(listner) {
    if (!this.isReady()) {
        this._loadListeners.push(listner);
    } else {
        listner(this);
    }
};

Bitmap.prototype._makeFontNameText = function() {
    return (this.fontItalic ? 'Italic ' : '') +
        this.fontSize + 'px ' + this.fontFace;
};

Bitmap.prototype._drawTextOutline = function(text, tx, ty, maxWidth) {
    var context = this._context;
    context.strokeStyle = this.outlineColor;
    context.lineWidth = this.outlineWidth;
    context.lineJoin = 'round';
    context.strokeText(text, tx, ty, maxWidth);
};

Bitmap.prototype._drawTextBody = function(text, tx, ty, maxWidth) {
    var context = this._context;
    context.fillStyle = this.textColor;
    context.fillText(text, tx, ty, maxWidth);
};

/**
 * @method _onLoad
 * @private
 */
Bitmap.prototype._onLoad = function() {
    this._image.removeEventListener('load', this._loadListener);
    this._image.removeEventListener('error', this._errorListener);

    this._renewCanvas();
    this._loadingState = 'loaded';
    this._callLoadListeners();

};

Bitmap.prototype._callLoadListeners = function() {
    while (this._loadListeners.length > 0) {
        var listener = this._loadListeners.shift();
        listener(this);
    }
};

Bitmap.prototype._onError = function(event) {
    this._image.removeEventListener('load', this._loadListener);
    this._image.removeEventListener('error', this._errorListener);
    this._loadingState = 'error';
};

Bitmap.prototype._setDirty = function() {
    this._dirty = true;
};

Bitmap.prototype.checkDirty = function() {
    if (this._dirty) {
        this._baseTexture.update();
        this._dirty = false;
    }
};

Bitmap.request = function(url){
    var bitmap = Object.create(Bitmap.prototype);
    bitmap._defer = true;
    bitmap.initialize();

    bitmap._url = url;
    bitmap._loadingState = 'pending';

    return bitmap;
};

Bitmap.prototype._requestImage = function(url){
    if (!this._loader) {
        this._loader = ResourceHandler.createLoader(url, this._requestImage.bind(this, url), this._onError.bind(this));
    }

    this._image = new Image();
    this._url = url;
    this._loadingState = 'requesting';

    this._image.src = url;

    this._image.addEventListener('load', this._loadListener = Bitmap.prototype._onLoad.bind(this));
    this._image.addEventListener('error', this._errorListener = this._loader || Bitmap.prototype._onError.bind(this));
};

Bitmap.prototype.isRequestReady = function(){
    return this._loadingState !== 'pending' &&
        this._loadingState !== 'requesting';
};

Bitmap.prototype.startRequest = function(){
    if(this._loadingState === 'pending'){
        this._requestImage(this._url);
    }
};


function Sprite() {
    this.initialize.apply(this, arguments);
}

Sprite._defaultId = 0;

Sprite.prototype = Object.create(PIXI.Sprite.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.generateKey = function(filename){
    return filename +':' + Sprite._defaultId++;
};

Sprite.prototype.initialize = function(filename) {
    let texture = new PIXI.Texture(new PIXI.BaseTexture());

    PIXI.Sprite.call(this, texture);

    this._bitmap = null;

    this._frame = new Rectangle();
    this._realFrame = new Rectangle();
    this._blendColor = [0, 0, 0, 0];
    this._colorTone = [0, 0, 0, 0];
    this._canvas = null;
    this._context = null;
    this._tintTexture = null;

    this._isPicture = false;
    this.opaque = false;
    this._filename = this.generateKey(filename);

    loader.getBitmapInfo(filename,this.initializeBitmap.bind(this));
    ImageManager.reserveAlias(this._filename);
};

Sprite._counter = 0;

Sprite.prototype.initializeBitmap = function(info){
    this.bitmap  = ImageManager.loadBitmap(info.alias|| info.name);
    if(info.frame) {
        let x = info.frame.x;
        let y = info.frame.y;
        let width = info.rotated ? info.frame.h :info.frame.w;
        let height = info.rotated? info.frame.w :info.frame.h;
        this.setFrame(x,y,width,height);
        this._rotated = info.rotated;
    }

    ImageManager.removeAlias(this._filename);
};

Object.defineProperty(Sprite.prototype, 'bitmap', {
    get: function() {
        return this._bitmap;
    },
    set: function(value) {
        if (this._bitmap !== value) {
            this._bitmap = value;

            if(value){
                this._refreshFrame = true;
                value.addLoadListener(this._onBitmapLoad.bind(this));
            }else{
                this._refreshFrame = false;
                this.texture.frame = Rectangle.emptyRectangle;
            }
        }
    },
    configurable: true
});

Object.defineProperty(Sprite.prototype, 'opacity', {
    get: function() {
        return this.alpha * 255;
    },
    set: function(value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Sprite.prototype.update = function() {
    this.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};

Sprite.prototype.move = function(x, y) {
    this.x = x;
    this.y = y;
};

Sprite.prototype.setFrame = function(x, y, width, height) {
    this._refreshFrame = false;
    var frame = this._frame;
    if (x !== frame.x || y !== frame.y ||
        width !== frame.width || height !== frame.height) {
        frame.x = x;
        frame.y = y;
        frame.width = width;
        frame.height = height;
        this._refresh();
    }
};

Sprite.prototype.getBlendColor = function() {
    return this._blendColor.clone();
};

Sprite.prototype.setBlendColor = function(color) {
    if (!(color instanceof Array)) {
        throw new Error('Argument must be an array');
    }
    if (!this._blendColor.equals(color)) {
        this._blendColor = color.clone();
        this._refresh();
    }
};

Sprite.prototype.getColorTone = function() {
    return this._colorTone.clone();
};

Sprite.prototype.setColorTone = function(tone) {
    if (!(tone instanceof Array)) {
        throw new Error('Argument must be an array');
    }
    if (!this._colorTone.equals(tone)) {
        this._colorTone = tone.clone();
        this._refresh();
    }
};

Sprite.prototype._onBitmapLoad = function(bitmapLoaded) {
    if(bitmapLoaded === this._bitmap){
        if (this._refreshFrame && this._bitmap) {
            this._refreshFrame = false;
            this._frame.width = this._bitmap.width;
            this._frame.height = this._bitmap.height;
        }
    }
    this._refresh();
};

Sprite.prototype._refresh = function() {
    var frameX = Math.floor(this._frame.x);
    var frameY = Math.floor(this._frame.y);
    var frameW = Math.floor(this._frame.width);
    var frameH = Math.floor(this._frame.height);

    var bitmapW = this._bitmap ? this._bitmap.width : 0;
    var bitmapH = this._bitmap ? this._bitmap.height : 0;
    var realX = frameX.clamp(0, bitmapW);
    var realY = frameY.clamp(0, bitmapH);
    var realW = (frameW - realX + frameX).clamp(0, bitmapW - realX);
    var realH = (frameH - realY + frameY).clamp(0, bitmapH - realY);

    this._realFrame.x = realX;
    this._realFrame.y = realY;
    this._realFrame.width = realW;
    this._realFrame.height = realH;
    this.pivot.x = frameX - realX;
    this.pivot.y = frameY - realY;

    if (realW > 0 && realH > 0) {
        if (this._needsTint()) {
            this._createTinter(realW, realH);
            this._executeTint(realX, realY, realW, realH);
            this._tintTexture.update();
            this.texture.baseTexture = this._tintTexture;
            this.texture.frame = new Rectangle(0, 0, realW, realH);
        } else {
            if (this._bitmap) {
                this.texture.baseTexture = this._bitmap.baseTexture;
                this.texture.frame = this._realFrame;
            }
        }
    } else if (this._bitmap) {
        this.texture.frame = Rectangle.emptyRectangle;
    } else {
        this.texture.baseTexture.width = Math.max(this.texture.baseTexture.width, this._frame.x + this._frame.width);
        this.texture.baseTexture.height = Math.max(this.texture.baseTexture.height, this._frame.y + this._frame.height);
        this.texture.frame = this._frame;
    }
    if(this._bitmap && this._rotated){
        this.texture.rotate = 2;
        if(this._rotated)
        {
            let frame = this._frame.clone();
            frame.x =0;
            frame.y = 0;
            frame.width = this._frame.height;
            frame.height  = this._frame.width;
            this.texture.trim =frame;
        }
    }
    this.texture._updateID ++;
};

Sprite.prototype.calculateVertices = function()
{
    var texture = this.texture;

    if (this._transformID === this.transform._worldID && this._textureID === texture._updateID)
    {
        return;
    }

    // update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
    if (this._textureID !== texture._updateID)
    {
        this.uvs = this._texture._uvs.uvsFloat32;
    }

    this._transformID = this.transform._worldID;
    this._textureID = texture._updateID;

    // set the vertex data

    var wt = this.transform.worldTransform;
    var a = wt.a;
    var b = wt.b;
    var c = wt.c;
    var d = wt.d;
    var tx = wt.tx;
    var ty = wt.ty;
    var vertexData = this.vertexData;
    var trim = texture.trim;
    var orig = texture.orig;
    var anchor = this._anchor;

    var w0 = 0;
    var w1 = 0;
    var h0 = 0;
    var h1 = 0;

    if (trim)
    {
        // if the sprite is trimmed and is not a tilingsprite then we need to add the extra
        // space before transforming the sprite coords.
        let oWidth = this._rotated? orig.height: orig.width;
        let oHeight = this._rotated? orig.width:orig.height;
        w1 = trim.x - (anchor._x * oWidth);
        w0 = w1 + trim.width;

        h1 = trim.y - (anchor._y * oHeight);
        h0 = h1 + trim.height;
    }
    else
    {
        w1 = -anchor._x * orig.width;
        w0 = w1 + orig.width;

        h1 = -anchor._y * orig.height;
        h0 = h1 + orig.height;
    }

    // xy
    vertexData[0] = (a * w1) + (c * h1) + tx;
    vertexData[1] = (d * h1) + (b * w1) + ty;

    // xy
    vertexData[2] = (a * w0) + (c * h1) + tx;
    vertexData[3] = (d * h1) + (b * w0) + ty;

    // xy
    vertexData[4] = (a * w0) + (c * h0) + tx;
    vertexData[5] = (d * h0) + (b * w0) + ty;

    // xy
    vertexData[6] = (a * w1) + (c * h0) + tx;
    vertexData[7] = (d * h0) + (b * w1) + ty;

    if (this._roundPixels)
    {
        for (var i = 0; i < 8; i++)
        {
            vertexData[i] = Math.round(vertexData[i]);
        }
    }
};

Sprite.prototype._isInBitmapRect = function(x, y, w, h) {
    return (this._bitmap && x + w > 0 && y + h > 0 &&
        x < this._bitmap.width && y < this._bitmap.height);
};

Sprite.prototype._needsTint = function() {
    var tone = this._colorTone;
    return tone[0] || tone[1] || tone[2] || tone[3] || this._blendColor[3] > 0;
};

Sprite.prototype._createTinter = function(w, h) {
    if (!this._canvas) {
        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
    }

    this._canvas.width = w;
    this._canvas.height = h;

    if (!this._tintTexture) {
        this._tintTexture = new PIXI.BaseTexture(this._canvas);
    }

    this._tintTexture.width = w;
    this._tintTexture.height = h;
    this._tintTexture.scaleMode = this._bitmap.baseTexture.scaleMode;
};

Sprite.prototype._executeTint = function(x, y, w, h) {
    var context = this._context;
    var tone = this._colorTone;
    var color = this._blendColor;

    context.globalCompositeOperation = 'copy';
    context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);

    if (viewport.canUseSaturationBlend()) {
        var gray = Math.max(0, tone[3]);
        context.globalCompositeOperation = 'saturation';
        context.fillStyle = 'rgba(255,255,255,' + gray / 255 + ')';
        context.fillRect(0, 0, w, h);
    }

    var r1 = Math.max(0, tone[0]);
    var g1 = Math.max(0, tone[1]);
    var b1 = Math.max(0, tone[2]);
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = Utils.rgbToCssColor(r1, g1, b1);
    context.fillRect(0, 0, w, h);

    if (viewport.canUseDifferenceBlend()) {
        context.globalCompositeOperation = 'difference';
        context.fillStyle = 'white';
        context.fillRect(0, 0, w, h);

        var r2 = Math.max(0, -tone[0]);
        var g2 = Math.max(0, -tone[1]);
        var b2 = Math.max(0, -tone[2]);
        context.globalCompositeOperation = 'lighter';
        context.fillStyle = Utils.rgbToCssColor(r2, g2, b2);
        context.fillRect(0, 0, w, h);

        context.globalCompositeOperation = 'difference';
        context.fillStyle = 'white';
        context.fillRect(0, 0, w, h);
    }

    var r3 = Math.max(0, color[0]);
    var g3 = Math.max(0, color[1]);
    var b3 = Math.max(0, color[2]);
    var a3 = Math.max(0, color[3]);
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = Utils.rgbToCssColor(r3, g3, b3);
    context.globalAlpha = a3 / 255;
    context.fillRect(0, 0, w, h);

    context.globalCompositeOperation = 'destination-in';
    context.globalAlpha = 1;
    context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);
};

Sprite.prototype._renderWebGL_PIXI = PIXI.Sprite.prototype._renderWebGL;

Sprite.prototype._speedUpCustomBlendModes = function(renderer) {
    var picture = renderer.plugins.picture;
    var blend = this.blendMode;
    if (renderer.renderingToScreen && renderer._activeRenderTarget.root) {
        if (picture.drawModes[blend]) {
            var stage = renderer._lastObjectRendered;
            var f = stage._filters;
            if (!f || !f[0]) {
                setTimeout(function () {
                    var f = stage._filters;
                    if (!f || !f[0]) {
                        stage.filters = []
                        stage.filterArea = new PIXI.Rectangle(0, 0, viewport.width, viewport.height);
                    }
                }, 0);
            }
        }
    }
};

Sprite.prototype._renderWebGL = function(renderer) {
    if (this.bitmap) {
        this.bitmap.touch();
    }
    if(this.bitmap && !this.bitmap.isReady()){
        return;
    }
    if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
        if (this._bitmap) {
            this._bitmap.checkDirty();
        }
        this.calculateVertices();
        if (this.pluginName === 'sprite' && this._isPicture) {
            this._speedUpCustomBlendModes(renderer);
            renderer.setObjectRenderer(renderer.plugins.picture);
            renderer.plugins.picture.render(this);
        } else {
            renderer.setObjectRenderer(renderer.plugins[this.pluginName]);
            renderer.plugins[this.pluginName].render(this);
        }
    }
};


function TilingSprite() {
    this.initialize.apply(this, arguments);
}

TilingSprite.prototype = Object.create(PIXI.TilingSprite.prototype);
TilingSprite.prototype.constructor = TilingSprite;
TilingSprite.prototype.generateKey = function(filename){
    return filename +':' + Sprite._defaultId++;
};

TilingSprite.prototype.initialize = function(filename,width,height) {

    var texture = new PIXI.Texture(new PIXI.BaseTexture());

    PIXI.TilingSprite.call(this, texture);

    this._bitmap = null;
    this._width = width || viewport.width;
    this._height = height || viewport.height;
    this._frame = new Rectangle();
    this.spriteId = Sprite._counter++;
    this._rotated = false;
    this.origin = new Point();

    this._filename = this.generateKey(filename);


    loader.getBitmapInfo(filename,this.initializeBitmap.bind(this));
    ImageManager.reserveAlias(this._filename);
};

TilingSprite.prototype.initializeBitmap = function(info){
    this.bitmap  = ImageManager.loadBitmap(info.alias|| info.name);
    if(info.frame) {
        this.setFrame(info.frame.x,info.frame.y,info.frame.w,info.frame.h);
        this._rotated = info.rotated;
    }
    ImageManager.removeAlias(this._filename);
};

TilingSprite.prototype._renderWebGL_PIXI = PIXI.TilingSprite.prototype._renderWebGL;

TilingSprite.prototype._renderWebGL = function(renderer) {
    if (this._bitmap) {
        this._bitmap.touch();
    }
    if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
        if (this._bitmap) {
            this._bitmap.checkDirty();
        }
        this._renderWebGL_PIXI(renderer);
    }
};

Object.defineProperty(TilingSprite.prototype, 'bitmap', {
    get: function() {
        return this._bitmap;
    },
    set: function(value) {
        if (this._bitmap !== value) {

            this._bitmap = value;
            if (this._bitmap) {
                this._bitmap.addLoadListener(this._onBitmapLoad.bind(this));
            } else {
                this.texture.frame = Rectangle.emptyRectangle;
            }
        }
    },
    configurable: true
});

Object.defineProperty(TilingSprite.prototype, 'opacity', {
    get: function() {
        return this.alpha * 255;
    },
    set: function(value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

TilingSprite.prototype.update = function() {
    this.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};

TilingSprite.prototype.move = function(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this._width = width || 0;
    this._height = height || 0;
};

TilingSprite.prototype.setFrame = function(x, y, width, height) {
    this._frame.x = x;
    this._frame.y = y;
    this._frame.width = width;
    this._frame.height = height;
    this._refresh();
};

TilingSprite.prototype._onBitmapLoad = function() {
    this.texture.baseTexture = this._bitmap.baseTexture;
    this._refresh();
};

TilingSprite.prototype._refresh = function() {
    if(!this._bitmap.isReady())
        return;
    var frame = this._frame.clone();
    if (frame.width === 0 && frame.height === 0 && this._bitmap) {
        frame.width = this._bitmap.width;
        frame.height = this._bitmap.height;
    }
    this.texture.frame = this._frame;
    if(this._rotated)
        this.texture.rotate = 2;
    this.texture._updateID++;
    this.tilingTexture = null;
};

TilingSprite.prototype._speedUpCustomBlendModes = Sprite.prototype._speedUpCustomBlendModes;

function Stage() {
    this.initialize.apply(this, arguments);
}

Stage.prototype = Object.create(PIXI.Container.prototype);
Stage.prototype.constructor = Stage;

Stage.prototype.initialize = function() {
    PIXI.Container.call(this);

    // The interactive flag causes a memory leak.
    this.interactive = false;
};


function Input() {
    throw new Error('This is a static class');
}

Input.initialize = function() {
    this.clear();
    this._wrapNwjsAlert();
    this._setupEventHandlers();
};

Input.keyRepeatWait = 24;

Input.keyRepeatInterval = 6;

Input.keyMapper = {
    9: 'tab',       // tab
    13: 'ok',       // enter
    16: 'shift',    // shift
    17: 'control',  // control
    18: 'control',  // alt
    27: 'escape',   // escape
    32: 'ok',       // space
    33: 'pageup',   // pageup
    34: 'pagedown', // pagedown
    37: 'left',     // left arrow
    38: 'up',       // up arrow
    39: 'right',    // right arrow
    40: 'down',     // down arrow
    45: 'escape',   // insert
    81: 'pageup',   // Q
    87: 'pagedown', // W
    88: 'escape',   // X
    90: 'ok',       // Z
    96: 'escape',   // numpad 0
    98: 'down',     // numpad 2
    100: 'left',    // numpad 4
    102: 'right',   // numpad 6
    104: 'up',      // numpad 8
    120: 'debug'    // F9
};

Input.gamepadMapper = {
    0: 'ok',        // A
    1: 'cancel',    // B
    2: 'shift',     // X
    3: 'menu',      // Y
    4: 'pageup',    // LB
    5: 'pagedown',  // RB
    12: 'up',       // D-pad up
    13: 'down',     // D-pad down
    14: 'left',     // D-pad left
    15: 'right',    // D-pad right
};

Input.clear = function() {
    this._currentState = {};
    this._previousState = {};
    this._gamepadStates = [];
    this._latestButton = null;
    this._pressedTime = 0;
    this._dir4 = 0;
    this._dir8 = 0;
    this._preferredAxis = '';
    this._date = 0;
};

Input.update = function() {
    this._pollGamepads();
    if (this._currentState[this._latestButton]) {
        this._pressedTime++;
    } else {
        this._latestButton = null;
    }
    for (var name in this._currentState) {
        if (this._currentState[name] && !this._previousState[name]) {
            this._latestButton = name;
            this._pressedTime = 0;
            this._date = Date.now();
        }
        this._previousState[name] = this._currentState[name];
    }
    this._updateDirection();
};

Input.isPressed = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isPressed('escape')) {
        return true;
    } else {
        return !!this._currentState[keyName];
    }
};

Input.isTriggered = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isTriggered('escape')) {
        return true;
    } else {
        return this._latestButton === keyName && this._pressedTime === 0;
    }
};


Input.isRepeated = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isRepeated('escape')) {
        return true;
    } else {
        return (this._latestButton === keyName &&
            (this._pressedTime === 0 ||
                (this._pressedTime >= this.keyRepeatWait &&
                    this._pressedTime % this.keyRepeatInterval === 0)));
    }
};

Input.isLongPressed = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isLongPressed('escape')) {
        return true;
    } else {
        return (this._latestButton === keyName &&
            this._pressedTime >= this.keyRepeatWait);
    }
};

Object.defineProperty(Input, 'dir4', {
    get: function() {
        return this._dir4;
    },
    configurable: true
});

Object.defineProperty(Input, 'dir8', {
    get: function() {
        return this._dir8;
    },
    configurable: true
});

Object.defineProperty(Input, 'date', {
    get: function() {
        return this._date;
    },
    configurable: true
});

Input._wrapNwjsAlert = function() {
    if (Utils.isNwjs()) {
        var _alert = window.alert;
        window.alert = function() {
            var gui = require('nw.gui');
            var win = gui.Window.get();
            _alert.apply(this, arguments);
            win.focus();
            Input.clear();
        };
    }
};

Input._setupEventHandlers = function() {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keyup', this._onKeyUp.bind(this));
    window.addEventListener('blur', this._onLostFocus.bind(this));
};

Input._onKeyDown = function(event) {
    if (this._shouldPreventDefault(event.keyCode)) {
        event.preventDefault();
    }
    if (event.keyCode === 144) {    // Numlock
        this.clear();
    }
    var buttonName = this.keyMapper[event.keyCode];
    if (ResourceHandler.exists() && buttonName === 'ok') {
        ResourceHandler.retry();
    } else if (buttonName) {
        this._currentState[buttonName] = true;
    }
};

Input._shouldPreventDefault = function(keyCode) {
    switch (keyCode) {
        case 8:     // backspace
        case 33:    // pageup
        case 34:    // pagedown
        case 37:    // left arrow
        case 38:    // up arrow
        case 39:    // right arrow
        case 40:    // down arrow
            return true;
    }
    return false;
};

Input._onKeyUp = function(event) {
    var buttonName = this.keyMapper[event.keyCode];
    if (buttonName) {
        this._currentState[buttonName] = false;
    }
    if (event.keyCode === 0) {  // For QtWebEngine on OS X
        this.clear();
    }
};

Input._onLostFocus = function() {
    this.clear();
};

Input._pollGamepads = function() {
    if (navigator.getGamepads) {
        var gamepads = navigator.getGamepads();
        if (gamepads) {
            for (var i = 0; i < gamepads.length; i++) {
                var gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    this._updateGamepadState(gamepad);
                }
            }
        }
    }
};

Input._updateGamepadState = function(gamepad) {
    var lastState = this._gamepadStates[gamepad.index] || [];
    var newState = [];
    var buttons = gamepad.buttons;
    var axes = gamepad.axes;
    var threshold = 0.5;
    newState[12] = false;
    newState[13] = false;
    newState[14] = false;
    newState[15] = false;
    for (var i = 0; i < buttons.length; i++) {
        newState[i] = buttons[i].pressed;
    }
    if (axes[1] < -threshold) {
        newState[12] = true;    // up
    } else if (axes[1] > threshold) {
        newState[13] = true;    // down
    }
    if (axes[0] < -threshold) {
        newState[14] = true;    // left
    } else if (axes[0] > threshold) {
        newState[15] = true;    // right
    }
    for (var j = 0; j < newState.length; j++) {
        if (newState[j] !== lastState[j]) {
            var buttonName = this.gamepadMapper[j];
            if (buttonName) {
                this._currentState[buttonName] = newState[j];
            }
        }
    }
    this._gamepadStates[gamepad.index] = newState;
};

Input._updateDirection = function() {
    var x = this._signX();
    var y = this._signY();

    this._dir8 = this._makeNumpadDirection(x, y);

    if (x !== 0 && y !== 0) {
        if (this._preferredAxis === 'x') {
            y = 0;
        } else {
            x = 0;
        }
    } else if (x !== 0) {
        this._preferredAxis = 'y';
    } else if (y !== 0) {
        this._preferredAxis = 'x';
    }

    this._dir4 = this._makeNumpadDirection(x, y);
};

Input._signX = function() {
    var x = 0;

    if (this.isPressed('left')) {
        x--;
    }
    if (this.isPressed('right')) {
        x++;
    }
    return x;
};

Input._signY = function() {
    var y = 0;

    if (this.isPressed('up')) {
        y--;
    }
    if (this.isPressed('down')) {
        y++;
    }
    return y;
};

Input._makeNumpadDirection = function(x, y) {
    if (x !== 0 || y !== 0) {
        return  5 - y * 3 + x;
    }
    return 0;
};

Input._isEscapeCompatible = function(keyName) {
    return keyName === 'cancel' || keyName === 'menu';
};

function TouchInput() {
    throw new Error('This is a static class');
}

TouchInput.initialize = function() {
    this.clear();
    this._setupEventHandlers();
};

TouchInput.keyRepeatWait = 24;

TouchInput.keyRepeatInterval = 6;

TouchInput.clear = function() {
    this._mousePressed = false;
    this._screenPressed = false;
    this._pressedTime = 0;
    this._events = {};
    this._triggerEvent = [];
    this._moveEvent = [];
    this._releaseEvent = [];
    this._events.triggered = false;
    this._events.cancelled = false;
    this._events.moved = false;
    this._events.released = false;
    this._events.wheelX = 0;
    this._events.wheelY = 0;
    this._triggered = false;
    this._cancelled = false;
    this._moved = false;
    this._released = false;
    this._wheelX = 0;
    this._wheelY = 0;
    this._x = 0;
    this._y = 0;
    this._date = 0;
};


TouchInput.update = function() {
    this._triggered = this._events.triggered;
    this._cancelled = this._events.cancelled;
    this._moved = this._events.moved;
    this._released = this._events.released;
    this._wheelX = this._events.wheelX;
    this._wheelY = this._events.wheelY;
    this._events.triggered = false;
    this._events.cancelled = false;
    this._events.moved = false;
    this._events.released = false;
    this._events.wheelX = 0;
    this._events.wheelY = 0;
    if (this.isPressed()) {
        this._pressedTime++;
    }
};

TouchInput.isPressed = function() {
    return this._mousePressed || this._screenPressed;
};

TouchInput.isTriggered = function() {
    return this._triggered;
};

TouchInput.isRepeated = function() {
    return (this.isPressed() &&
        (this._triggered ||
            (this._pressedTime >= this.keyRepeatWait &&
                this._pressedTime % this.keyRepeatInterval === 0)));
};

TouchInput.isLongPressed = function() {
    return this.isPressed() && this._pressedTime >= this.keyRepeatWait;
};

TouchInput.isCancelled = function() {
    return this._cancelled;
};

TouchInput.isMoved = function() {
    return this._moved;
};

TouchInput.isReleased = function() {
    return this._released;
};

Object.defineProperty(TouchInput, 'wheelX', {
    get: function() {
        return this._wheelX;
    },
    configurable: true
});

Object.defineProperty(TouchInput, 'wheelY', {
    get: function() {
        return this._wheelY;
    },
    configurable: true
});


Object.defineProperty(TouchInput, 'x', {
    get: function() {
        return this._x;
    },
    configurable: true
});

Object.defineProperty(TouchInput, 'y', {
    get: function() {
        return this._y;
    },
    configurable: true
});

Object.defineProperty(TouchInput, 'date', {
    get: function() {
        return this._date;
    },
    configurable: true
});

TouchInput._setupEventHandlers = function() {
    var isSupportPassive = Utils.isSupportPassiveEvent();
    document.addEventListener('mousedown', this._onMouseDown.bind(this));
    document.addEventListener('mousemove', this._onMouseMove.bind(this));
    document.addEventListener('mouseup', this._onMouseUp.bind(this));
    document.addEventListener('wheel', this._onWheel.bind(this));
    document.addEventListener('touchstart', this._onTouchStart.bind(this), isSupportPassive ? {passive: false} : false);
    document.addEventListener('touchmove', this._onTouchMove.bind(this), isSupportPassive ? {passive: false} : false);
    document.addEventListener('touchend', this._onTouchEnd.bind(this));
    document.addEventListener('touchcancel', this._onTouchCancel.bind(this));
    document.addEventListener('pointerdown', this._onPointerDown.bind(this));
};

TouchInput._onMouseDown = function(event) {
    if (event.button === 0) {
        this._onLeftButtonDown(event);
    } else if (event.button === 1) {
        this._onMiddleButtonDown(event);
    } else if (event.button === 2) {
        this._onRightButtonDown(event);
    }
};

TouchInput._onLeftButtonDown = function(event) {
    var x = viewport.pageToCanvasX(event.pageX);
    var y = viewport.pageToCanvasY(event.pageY);
    if (viewport.isInsideCanvas(x, y)) {
        this._mousePressed = true;
        this._pressedTime = 0;
        this._onTrigger(x, y);
    }
};

TouchInput._onMiddleButtonDown = function(event) {
};

TouchInput._onRightButtonDown = function(event) {
    var x = viewport.pageToCanvasX(event.pageX);
    var y = viewport.pageToCanvasY(event.pageY);
    if (viewport.isInsideCanvas(x, y)) {
        this._onCancel(x, y);
    }
};

TouchInput._onMouseMove = function(event) {
    if (this._mousePressed) {
        var x = viewport.pageToCanvasX(event.pageX);
        var y = viewport.pageToCanvasY(event.pageY);
        this._onMove(x, y);
    }
};

TouchInput._onMouseUp = function(event) {
    if (event.button === 0) {
        var x = viewport.pageToCanvasX(event.pageX);
        var y = viewport.pageToCanvasY(event.pageY);
        this._mousePressed = false;
        this._onRelease(x, y);
    }
};

TouchInput._onWheel = function(event) {
    this._events.wheelX += event.deltaX;
    this._events.wheelY += event.deltaY;
    event.preventDefault();
};

TouchInput._onTouchStart = function(event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
        var touch = event.changedTouches[i];
        var x = viewport.pageToCanvasX(touch.pageX);
        var y = viewport.pageToCanvasY(touch.pageY);
        if (viewport.isInsideCanvas(x, y)) {
            this._screenPressed = true;
            this._pressedTime = 0;
            if (event.touches.length >= 2) {
                this._onCancel(x, y);
            } else {
                this._onTrigger(x, y);
            }
            event.preventDefault();
        }
    }
    if (window.cordova || window.navigator.standalone) {
        event.preventDefault();
    }
};

TouchInput._onTouchMove = function(event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
        var touch = event.changedTouches[i];
        var x = viewport.pageToCanvasX(touch.pageX);
        var y = viewport.pageToCanvasY(touch.pageY);
        this._onMove(x, y);
    }
};

TouchInput._onTouchEnd = function(event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
        var touch = event.changedTouches[i];
        var x = viewport.pageToCanvasX(touch.pageX);
        var y = viewport.pageToCanvasY(touch.pageY);
        this._screenPressed = false;
        this._onRelease(x, y);
    }
};

TouchInput._onTouchCancel = function(event) {
    this._screenPressed = false;
};

TouchInput._onPointerDown = function(event) {
    if (event.pointerType === 'touch' && !event.isPrimary) {
        var x = viewport.pageToCanvasX(event.pageX);
        var y = viewport.pageToCanvasY(event.pageY);
        if (viewport.isInsideCanvas(x, y)) {
            // For Microsoft Edge
            this._onCancel(x, y);
            event.preventDefault();
        }
    }
};

TouchInput._onTrigger = function(x, y) {
    this._events.triggered = true;
    this._x = x;
    this._y = y;
    this._triggerEvent.forEach(function(event){
        if(event)
            event(x,y);
    });
    this._date = Date.now();
};

TouchInput._onCancel = function(x, y) {
    this._events.cancelled = true;
    this._x = x;
    this._y = y;
};

TouchInput._onMove = function(x, y) {
    this._events.moved = true;
    this._x = x;
    this._y = y;
    this._moveEvent.forEach(function(event){
        if(event)
            event(x,y);
    });
};

TouchInput._onRelease = function(x, y) {
    this._events.released = true;
    this._x = x;
    this._y = y;
    this._releaseEvent.forEach(function(event){
        if(event)
            event(x,y);
    });
};

TouchInput.registerTriggerEvent = function(callback){
    if(callback && this._triggerEvent.indexOf(callback) === -1)
        this._triggerEvent.push(callback);
};

TouchInput.registerMoveEvent = function(callback){
    if(callback && this._moveEvent.indexOf(callback) === -1)
        this._moveEvent.push(callback);
};

TouchInput.registerReleaseEvent = function(callback){
    if(callback && this._releaseEvent.indexOf(callback) === -1)
        this._releaseEvent.push(callback);
}

function WebAudio() {
    this.initialize.apply(this, arguments);
}

WebAudio._standAlone = (function(top){
    return !top.ResourceHandler;
})(this);

WebAudio.prototype.initialize = function(url) {
    if (!WebAudio._initialized) {
        WebAudio.initialize();
    }
    this.clear();

    if(!WebAudio._standAlone){
        this._loader = ResourceHandler.createLoader(url, this._load.bind(this, url), function() {
            this._hasError = true;
        }.bind(this));
    }
    this._load(url);
    this._url = url;
};

WebAudio._masterVolume   = 1;
WebAudio._context        = null;
WebAudio._masterGainNode = null;
WebAudio._initialized    = false;
WebAudio._unlocked       = false;

WebAudio.initialize = function(noAudio) {
    if (!this._initialized) {
        if (!noAudio) {
            this._createContext();
            this._detectCodecs();
            this._createMasterGainNode();
            this._setupEventHandlers();
        }
        this._initialized = true;
    }
    return !!this._context;
};

WebAudio.canPlayOgg = function() {
    if (!this._initialized) {
        this.initialize();
    }
    return !!this._canPlayOgg;
};

WebAudio.canPlayM4a = function() {
    if (!this._initialized) {
        this.initialize();
    }
    return !!this._canPlayM4a;
};

WebAudio.setMasterVolume = function(value) {
    this._masterVolume = value;
    if (this._masterGainNode) {
        this._masterGainNode.gain.setValueAtTime(this._masterVolume, this._context.currentTime);
    }
};

WebAudio._createContext = function() {
    try {
        if (typeof AudioContext !== 'undefined') {
            this._context = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            this._context = new webkitAudioContext();
        }
    } catch (e) {
        this._context = null;
    }
};

WebAudio._detectCodecs = function() {
    var audio = document.createElement('audio');
    if (audio.canPlayType) {
        this._canPlayOgg = audio.canPlayType('audio/ogg');
        this._canPlayM4a = audio.canPlayType('audio/mp4');
    }
};

WebAudio._createMasterGainNode = function() {
    var context = WebAudio._context;
    if (context) {
        this._masterGainNode = context.createGain();
        this._masterGainNode.gain.setValueAtTime(this._masterVolume, context.currentTime);
        this._masterGainNode.connect(context.destination);
    }
};

WebAudio._setupEventHandlers = function() {
    var resumeHandler = function() {
        var context = WebAudio._context;
        if (context && context.state === "suspended" && typeof context.resume === "function") {
            context.resume().then(function() {
                WebAudio._onTouchStart();
            })
        } else {
            WebAudio._onTouchStart();
        }
    };
    document.addEventListener("keydown", resumeHandler);
    document.addEventListener("mousedown", resumeHandler);
    document.addEventListener("touchend", resumeHandler);
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
};

WebAudio._onTouchStart = function() {
    var context = WebAudio._context;
    if (context && !this._unlocked) {
        // Unlock Web Audio on iOS
        var node = context.createBufferSource();
        node.start(0);
        this._unlocked = true;
    }
};

WebAudio._onVisibilityChange = function() {
    if (document.visibilityState === 'hidden') {
        this._onHide();
    } else {
        this._onShow();
    }
};

WebAudio._onHide = function() {
    if (this._shouldMuteOnHide()) {
        this._fadeOut(1);
    }
};

WebAudio._onShow = function() {
    if (this._shouldMuteOnHide()) {
        this._fadeIn(0.5);
    }
};

WebAudio._shouldMuteOnHide = function() {
    return Utils.isMobileDevice();
};

WebAudio._fadeIn = function(duration) {
    if (this._masterGainNode) {
        var gain = this._masterGainNode.gain;
        var currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(this._masterVolume, currentTime + duration);
    }
};

WebAudio._fadeOut = function(duration) {
    if (this._masterGainNode) {
        var gain = this._masterGainNode.gain;
        var currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(this._masterVolume, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
    }
};

WebAudio.prototype.clear = function() {
    this.stop();
    this._buffer = null;
    this._sourceNode = null;
    this._gainNode = null;
    this._pannerNode = null;
    this._totalTime = 0;
    this._sampleRate = 0;
    this._loopStart = 0;
    this._loopLength = 0;
    this._startTime = 0;
    this._volume = 1;
    this._pitch = 1;
    this._pan = 0;
    this._endTimer = null;
    this._loadListeners = [];
    this._stopListeners = [];
    this._hasError = false;
    this._autoPlay = false;
};

Object.defineProperty(WebAudio.prototype, 'url', {
    get: function() {
        return this._url;
    },
    configurable: true
});

Object.defineProperty(WebAudio.prototype, 'volume', {
    get: function() {
        return this._volume;
    },
    set: function(value) {
        this._volume = value;
        if (this._gainNode) {
            this._gainNode.gain.setValueAtTime(this._volume, WebAudio._context.currentTime);
        }
    },
    configurable: true
});

Object.defineProperty(WebAudio.prototype, 'pitch', {
    get: function() {
        return this._pitch;
    },
    set: function(value) {
        if (this._pitch !== value) {
            this._pitch = value;
            if (this.isPlaying()) {
                this.play(this._sourceNode.loop, 0);
            }
        }
    },
    configurable: true
});

Object.defineProperty(WebAudio.prototype, 'pan', {
    get: function() {
        return this._pan;
    },
    set: function(value) {
        this._pan = value;
        this._updatePanner();
    },
    configurable: true
});

WebAudio.prototype.isReady = function() {
    return !!this._buffer;
};

WebAudio.prototype.isError = function() {
    return this._hasError;
};

WebAudio.prototype.isPlaying = function() {
    return !!this._sourceNode;
};

WebAudio.prototype.play = function(loop, offset) {
    if (this.isReady()) {
        offset = offset || 0;
        this._startPlaying(loop, offset);
    } else if (WebAudio._context) {
        this._autoPlay = true;
        this.addLoadListener(function() {
            if (this._autoPlay) {
                this.play(loop, offset);
            }
        }.bind(this));
    }
};

WebAudio.prototype.stop = function() {
    this._autoPlay = false;
    this._removeEndTimer();
    this._removeNodes();
    if (this._stopListeners) {
        while (this._stopListeners.length > 0) {
            var listner = this._stopListeners.shift();
            listner();
        }
    }
};
WebAudio.prototype.fadeIn = function(duration) {
    if (this.isReady()) {
        if (this._gainNode) {
            var gain = this._gainNode.gain;
            var currentTime = WebAudio._context.currentTime;
            gain.setValueAtTime(0, currentTime);
            gain.linearRampToValueAtTime(this._volume, currentTime + duration);
        }
    } else if (this._autoPlay) {
        this.addLoadListener(function() {
            this.fadeIn(duration);
        }.bind(this));
    }
};

WebAudio.prototype.fadeOut = function(duration) {
    if (this._gainNode) {
        var gain = this._gainNode.gain;
        var currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(this._volume, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
    }
    this._autoPlay = false;
};

WebAudio.prototype.seek = function() {
    if (WebAudio._context) {
        var pos = (WebAudio._context.currentTime - this._startTime) * this._pitch;
        if (this._loopLength > 0) {
            while (pos >= this._loopStart + this._loopLength) {
                pos -= this._loopLength;
            }
        }
        return pos;
    } else {
        return 0;
    }
};

WebAudio.prototype.addLoadListener = function(listner) {
    this._loadListeners.push(listner);
};


WebAudio.prototype.addStopListener = function(listner) {
    this._stopListeners.push(listner);
};


WebAudio.prototype._load = function(url) {
    if (WebAudio._context) {
        var xhr = new XMLHttpRequest();
        if(Decrypter.hasEncryptedAudio) url = Decrypter.extToEncryptExt(url);
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            if (xhr.status < 400) {
                this._onXhrLoad(xhr);
            }
        }.bind(this);
        xhr.onerror = this._loader || function(){this._hasError = true;}.bind(this);
        xhr.send();
    }
};

WebAudio.prototype._onXhrLoad = function(xhr) {
    var array = xhr.response;
    if(Decrypter.hasEncryptedAudio) array = Decrypter.decryptArrayBuffer(array);
    this._readLoopComments(new Uint8Array(array));
    WebAudio._context.decodeAudioData(array, function(buffer) {
        this._buffer = buffer;
        this._totalTime = buffer.duration;
        if (this._loopLength > 0 && this._sampleRate > 0) {
            this._loopStart /= this._sampleRate;
            this._loopLength /= this._sampleRate;
        } else {
            this._loopStart = 0;
            this._loopLength = this._totalTime;
        }
        this._onLoad();
    }.bind(this));
};

WebAudio.prototype._startPlaying = function(loop, offset) {
    if (this._loopLength > 0) {
        while (offset >= this._loopStart + this._loopLength) {
            offset -= this._loopLength;
        }
    }
    this._removeEndTimer();
    this._removeNodes();
    this._createNodes();
    this._connectNodes();
    this._sourceNode.loop = loop;
    this._sourceNode.start(0, offset);
    this._startTime = WebAudio._context.currentTime - offset / this._pitch;
    this._createEndTimer();
};


WebAudio.prototype._createNodes = function() {
    var context = WebAudio._context;
    this._sourceNode = context.createBufferSource();
    this._sourceNode.buffer = this._buffer;
    this._sourceNode.loopStart = this._loopStart;
    this._sourceNode.loopEnd = this._loopStart + this._loopLength;
    this._sourceNode.playbackRate.setValueAtTime(this._pitch, context.currentTime);
    this._gainNode = context.createGain();
    this._gainNode.gain.setValueAtTime(this._volume, context.currentTime);
    this._pannerNode = context.createPanner();
    this._pannerNode.panningModel = 'equalpower';
    this._updatePanner();
};

WebAudio.prototype._connectNodes = function() {
    this._sourceNode.connect(this._gainNode);
    this._gainNode.connect(this._pannerNode);
    this._pannerNode.connect(WebAudio._masterGainNode);
};

WebAudio.prototype._removeNodes = function() {
    if (this._sourceNode) {
        this._sourceNode.stop(0);
        this._sourceNode = null;
        this._gainNode = null;
        this._pannerNode = null;
    }
};

WebAudio.prototype._createEndTimer = function() {
    if (this._sourceNode && !this._sourceNode.loop) {
        var endTime = this._startTime + this._totalTime / this._pitch;
        var delay =  endTime - WebAudio._context.currentTime;
        this._endTimer = setTimeout(function() {
            this.stop();
        }.bind(this), delay * 1000);
    }
};

WebAudio.prototype._removeEndTimer = function() {
    if (this._endTimer) {
        clearTimeout(this._endTimer);
        this._endTimer = null;
    }
};

WebAudio.prototype._updatePanner = function() {
    if (this._pannerNode) {
        var x = this._pan;
        var z = 1 - Math.abs(x);
        this._pannerNode.setPosition(x, 0, z);
    }
};

WebAudio.prototype._onLoad = function() {
    while (this._loadListeners.length > 0) {
        var listner = this._loadListeners.shift();
        listner();
    }
};

WebAudio.prototype._readLoopComments = function(array) {
    this._readOgg(array);
    this._readMp4(array);
};

WebAudio.prototype._readOgg = function(array) {
    var index = 0;
    while (index < array.length) {
        if (this._readFourCharacters(array, index) === 'OggS') {
            index += 26;
            var vorbisHeaderFound = false;
            var numSegments = array[index++];
            var segments = [];
            for (var i = 0; i < numSegments; i++) {
                segments.push(array[index++]);
            }
            for (i = 0; i < numSegments; i++) {
                if (this._readFourCharacters(array, index + 1) === 'vorb') {
                    var headerType = array[index];
                    if (headerType === 1) {
                        this._sampleRate = this._readLittleEndian(array, index + 12);
                    } else if (headerType === 3) {
                        this._readMetaData(array, index, segments[i]);
                    }
                    vorbisHeaderFound = true;
                }
                index += segments[i];
            }
            if (!vorbisHeaderFound) {
                break;
            }
        } else {
            break;
        }
    }
};

WebAudio.prototype._readMp4 = function(array) {
    if (this._readFourCharacters(array, 4) === 'ftyp') {
        var index = 0;
        while (index < array.length) {
            var size = this._readBigEndian(array, index);
            var name = this._readFourCharacters(array, index + 4);
            if (name === 'moov') {
                index += 8;
            } else {
                if (name === 'mvhd') {
                    this._sampleRate = this._readBigEndian(array, index + 20);
                }
                if (name === 'udta' || name === 'meta') {
                    this._readMetaData(array, index, size);
                }
                index += size;
                if (size <= 1) {
                    break;
                }
            }
        }
    }
};


WebAudio.prototype._readMetaData = function(array, index, size) {
    for (var i = index; i < index + size - 10; i++) {
        if (this._readFourCharacters(array, i) === 'LOOP') {
            var text = '';
            while (array[i] > 0) {
                text += String.fromCharCode(array[i++]);
            }
            if (text.match(/LOOPSTART=([0-9]+)/)) {
                this._loopStart = parseInt(RegExp.$1);
            }
            if (text.match(/LOOPLENGTH=([0-9]+)/)) {
                this._loopLength = parseInt(RegExp.$1);
            }
            if (text == 'LOOPSTART' || text == 'LOOPLENGTH') {
                var text2 = '';
                i += 16;
                while (array[i] > 0) {
                    text2 += String.fromCharCode(array[i++]);
                }
                if (text == 'LOOPSTART') {
                    this._loopStart = parseInt(text2);
                } else {
                    this._loopLength = parseInt(text2);
                }
            }
        }
    }
};

WebAudio.prototype._readLittleEndian = function(array, index) {
    return (array[index + 3] * 0x1000000 + array[index + 2] * 0x10000 +
        array[index + 1] * 0x100 + array[index + 0]);
};

WebAudio.prototype._readBigEndian = function(array, index) {
    return (array[index + 0] * 0x1000000 + array[index + 1] * 0x10000 +
        array[index + 2] * 0x100 + array[index + 3]);
};

WebAudio.prototype._readFourCharacters = function(array, index) {
    var string = '';
    for (var i = 0; i < 4; i++) {
        string += String.fromCharCode(array[index + i]);
    }
    return string;
};

function Html5Audio() {
    throw new Error('This is a static class');
}

Html5Audio._initialized = false;
Html5Audio._unlocked = false;
Html5Audio._audioElement = null;
Html5Audio._gainTweenInterval = null;
Html5Audio._tweenGain = 0;
Html5Audio._tweenTargetGain = 0;
Html5Audio._tweenGainStep = 0;
Html5Audio._staticSePath = null;


Html5Audio.setup = function (url) {
    if (!this._initialized) {
        this.initialize();
    }
    this.clear();

    if(Decrypter.hasEncryptedAudio && this._audioElement.src) {
        window.URL.revokeObjectURL(this._audioElement.src);
    }
    this._url = url;
};


Html5Audio.initialize = function () {
    if (!this._initialized) {
        if (!this._audioElement) {
            try {
                this._audioElement = new Audio();
            } catch (e) {
                this._audioElement = null;
            }
        }
        if (!!this._audioElement) this._setupEventHandlers();
        this._initialized = true;
    }
    return !!this._audioElement;
};

Html5Audio._setupEventHandlers = function () {
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    this._audioElement.addEventListener("loadeddata", this._onLoadedData.bind(this));
    this._audioElement.addEventListener("error", this._onError.bind(this));
    this._audioElement.addEventListener("ended", this._onEnded.bind(this));
};

Html5Audio._onTouchStart = function () {
    if (this._audioElement && !this._unlocked) {
        if (this._isLoading) {
            this._load(this._url);
            this._unlocked = true;
        } else {
            if (this._staticSePath) {
                this._audioElement.src = this._staticSePath;
                this._audioElement.volume = 0;
                this._audioElement.loop = false;
                this._audioElement.play();
                this._unlocked = true;
            }
        }
    }
};

Html5Audio._onVisibilityChange = function () {
    if (document.visibilityState === 'hidden') {
        this._onHide();
    } else {
        this._onShow();
    }
};

Html5Audio._onLoadedData = function () {
    this._buffered = true;
    if (this._unlocked) this._onLoad();
};

Html5Audio._onError = function () {
    this._hasError = true;
};

Html5Audio._onEnded = function () {
    if (!this._audioElement.loop) {
        this.stop();
    }
};

Html5Audio._onHide = function () {
    this._audioElement.volume = 0;
    this._tweenGain = 0;
};

Html5Audio._onShow = function () {
    this.fadeIn(0.5);
};


Html5Audio.clear = function () {
    this.stop();
    this._volume = 1;
    this._loadListeners = [];
    this._hasError = false;
    this._autoPlay = false;
    this._isLoading = false;
    this._buffered = false;
};

Html5Audio.setStaticSe = function (url) {
    if (!this._initialized) {
        this.initialize();
        this.clear();
    }
    this._staticSePath = url;
};

Object.defineProperty(Html5Audio, 'url', {
    get: function () {
        return Html5Audio._url;
    },
    configurable: true
});

Object.defineProperty(Html5Audio, 'volume', {
    get: function () {
        return Html5Audio._volume;
    }.bind(this),
    set: function (value) {
        Html5Audio._volume = value;
        if (Html5Audio._audioElement) {
            Html5Audio._audioElement.volume = this._volume;
        }
    },
    configurable: true
});

Html5Audio.isReady = function () {
    return this._buffered;
};

Html5Audio.isError = function () {
    return this._hasError;
};

Html5Audio.isPlaying = function () {
    return !this._audioElement.paused;
};

Html5Audio.play = function (loop, offset) {
    if (this.isReady()) {
        offset = offset || 0;
        this._startPlaying(loop, offset);
    } else if (Html5Audio._audioElement) {
        this._autoPlay = true;
        this.addLoadListener(function () {
            if (this._autoPlay) {
                this.play(loop, offset);
                if (this._gainTweenInterval) {
                    clearInterval(this._gainTweenInterval);
                    this._gainTweenInterval = null;
                }
            }
        }.bind(this));
        if (!this._isLoading) this._load(this._url);
    }
};

Html5Audio.stop = function () {
    if (this._audioElement) this._audioElement.pause();
    this._autoPlay = false;
    if (this._tweenInterval) {
        clearInterval(this._tweenInterval);
        this._tweenInterval = null;
        this._audioElement.volume = 0;
    }
};

Html5Audio.fadeIn = function (duration) {
    if (this.isReady()) {
        if (this._audioElement) {
            this._tweenTargetGain = this._volume;
            this._tweenGain = 0;
            this._startGainTween(duration);
        }
    } else if (this._autoPlay) {
        this.addLoadListener(function () {
            this.fadeIn(duration);
        }.bind(this));
    }
};

Html5Audio.fadeOut = function (duration) {
    if (this._audioElement) {
        this._tweenTargetGain = 0;
        this._tweenGain = this._volume;
        this._startGainTween(duration);
    }
};

Html5Audio.seek = function () {
    if (this._audioElement) {
        return this._audioElement.currentTime;
    } else {
        return 0;
    }
};

Html5Audio.addLoadListener = function (listner) {
    this._loadListeners.push(listner);
};


Html5Audio._load = function (url) {
    if (this._audioElement) {
        this._isLoading = true;
        this._audioElement.src = url;
        this._audioElement.load();
    }
};

Html5Audio._startPlaying = function (loop, offset) {
    this._audioElement.loop = loop;
    if (this._gainTweenInterval) {
        clearInterval(this._gainTweenInterval);
        this._gainTweenInterval = null;
    }
    if (this._audioElement) {
        this._audioElement.volume = this._volume;
        this._audioElement.currentTime = offset;
        this._audioElement.play();
    }
};

Html5Audio._onLoad = function () {
    this._isLoading = false;
    while (this._loadListeners.length > 0) {
        var listener = this._loadListeners.shift();
        listener();
    }
};

Html5Audio._startGainTween = function (duration) {
    this._audioElement.volume = this._tweenGain;
    if (this._gainTweenInterval) {
        clearInterval(this._gainTweenInterval);
        this._gainTweenInterval = null;
    }
    this._tweenGainStep = (this._tweenTargetGain - this._tweenGain) / (60 * duration);
    this._gainTweenInterval = setInterval(function () {
        Html5Audio._applyTweenValue(Html5Audio._tweenTargetGain);
    }, 1000 / 60);
};

Html5Audio._applyTweenValue = function (volume) {
    Html5Audio._tweenGain += Html5Audio._tweenGainStep;
    if (Html5Audio._tweenGain < 0 && Html5Audio._tweenGainStep < 0) {
        Html5Audio._tweenGain = 0;
    }
    else if (Html5Audio._tweenGain > volume && Html5Audio._tweenGainStep > 0) {
        Html5Audio._tweenGain = volume;
    }

    if (Math.abs(Html5Audio._tweenTargetGain - Html5Audio._tweenGain) < 0.01) {
        Html5Audio._tweenGain = Html5Audio._tweenTargetGain;
        clearInterval(Html5Audio._gainTweenInterval);
        Html5Audio._gainTweenInterval = null;
    }

    Html5Audio._audioElement.volume = Html5Audio._tweenGain;
};

AudioManager = function() {
    throw new Error('This is a static class');
}

AudioManager._masterVolume   = 1;   // (min: 0, max: 1)
AudioManager._bgmVolume      = 100;
AudioManager._bgsVolume      = 100;
AudioManager._meVolume       = 100;
AudioManager._seVolume       = 100;
AudioManager._currentBgm     = null;
AudioManager._currentBgs     = null;
AudioManager._bgmBuffer      = null;
AudioManager._bgsBuffer      = null;
AudioManager._meBuffer       = null;
AudioManager._seBuffers      = [];
AudioManager._staticBuffers  = [];
AudioManager._replayFadeTime = 0.5;
AudioManager._path           = 'audio/';
AudioManager._blobUrl        = null;

Object.defineProperty(AudioManager, 'masterVolume', {
    get: function() {
        return this._masterVolume;
    },
    set: function(value) {
        this._masterVolume = value;
        WebAudio.setMasterVolume(this._masterVolume);
        Graphics.setVideoVolume(this._masterVolume);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'bgmVolume', {
    get: function() {
        return this._bgmVolume;
    },
    set: function(value) {
        this._bgmVolume = value;
        this.updateBgmParameters(this._currentBgm);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'bgsVolume', {
    get: function() {
        return this._bgsVolume;
    },
    set: function(value) {
        this._bgsVolume = value;
        this.updateBgsParameters(this._currentBgs);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'meVolume', {
    get: function() {
        return this._meVolume;
    },
    set: function(value) {
        this._meVolume = value;
        this.updateMeParameters(this._currentMe);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'seVolume', {
    get: function() {
        return this._seVolume;
    },
    set: function(value) {
        this._seVolume = value;
    },
    configurable: true
});

AudioManager.playBgm = function(bgm, pos) {
    if (this.isCurrentBgm(bgm)) {
        this.updateBgmParameters(bgm);
    } else {
        this.stopBgm();
        if (bgm.name) {
            if(Decrypter.hasEncryptedAudio && this.shouldUseHtml5Audio()){
                this.playEncryptedBgm(bgm, pos);
            }
            else {
                this._bgmBuffer = this.createBuffer('bgm', bgm.name);
                this.updateBgmParameters(bgm);
                if (!this._meBuffer) {
                    this._bgmBuffer.play(true, pos || 0);
                }
            }
        }
    }
    this.updateCurrentBgm(bgm, pos);
};

AudioManager.playEncryptedBgm = function(bgm, pos) {
    var ext = this.audioFileExt();
    var url = this._path + 'bgm/' + encodeURIComponent(bgm.name) + ext;
    url = Decrypter.extToEncryptExt(url);
    Decrypter.decryptHTML5Audio(url, bgm, pos);
};

AudioManager.createDecryptBuffer = function(url, bgm, pos){
    this._blobUrl = url;
    this._bgmBuffer = this.createBuffer('bgm', bgm.name);
    this.updateBgmParameters(bgm);
    if (!this._meBuffer) {
        this._bgmBuffer.play(true, pos || 0);
    }
    this.updateCurrentBgm(bgm, pos);
};

AudioManager.replayBgm = function(bgm) {
    if (this.isCurrentBgm(bgm)) {
        this.updateBgmParameters(bgm);
    } else {
        this.playBgm(bgm, bgm.pos);
        if (this._bgmBuffer) {
            this._bgmBuffer.fadeIn(this._replayFadeTime);
        }
    }
};

AudioManager.isCurrentBgm = function(bgm) {
    return (this._currentBgm && this._bgmBuffer &&
        this._currentBgm.name === bgm.name);
};

AudioManager.updateBgmParameters = function(bgm) {
    this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
};

AudioManager.updateCurrentBgm = function(bgm, pos) {
    this._currentBgm = {
        name: bgm.name,
        volume: bgm.volume,
        pitch: bgm.pitch,
        pan: bgm.pan,
        pos: pos
    };
};

AudioManager.stopBgm = function() {
    if (this._bgmBuffer) {
        this._bgmBuffer.stop();
        this._bgmBuffer = null;
        this._currentBgm = null;
    }
};

AudioManager.fadeOutBgm = function(duration) {
    if (this._bgmBuffer && this._currentBgm) {
        this._bgmBuffer.fadeOut(duration);
        this._currentBgm = null;
    }
};

AudioManager.fadeInBgm = function(duration) {
    if (this._bgmBuffer && this._currentBgm) {
        this._bgmBuffer.fadeIn(duration);
    }
};

AudioManager.playBgs = function(bgs, pos) {
    if (this.isCurrentBgs(bgs)) {
        this.updateBgsParameters(bgs);
    } else {
        this.stopBgs();
        if (bgs.name) {
            this._bgsBuffer = this.createBuffer('bgs', bgs.name);
            this.updateBgsParameters(bgs);
            this._bgsBuffer.play(true, pos || 0);
        }
    }
    this.updateCurrentBgs(bgs, pos);
};

AudioManager.replayBgs = function(bgs) {
    if (this.isCurrentBgs(bgs)) {
        this.updateBgsParameters(bgs);
    } else {
        this.playBgs(bgs, bgs.pos);
        if (this._bgsBuffer) {
            this._bgsBuffer.fadeIn(this._replayFadeTime);
        }
    }
};

AudioManager.isCurrentBgs = function(bgs) {
    return (this._currentBgs && this._bgsBuffer &&
        this._currentBgs.name === bgs.name);
};

AudioManager.updateBgsParameters = function(bgs) {
    this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
};

AudioManager.updateCurrentBgs = function(bgs, pos) {
    this._currentBgs = {
        name: bgs.name,
        volume: bgs.volume,
        pitch: bgs.pitch,
        pan: bgs.pan,
        pos: pos
    };
};

AudioManager.stopBgs = function() {
    if (this._bgsBuffer) {
        this._bgsBuffer.stop();
        this._bgsBuffer = null;
        this._currentBgs = null;
    }
};

AudioManager.fadeOutBgs = function(duration) {
    if (this._bgsBuffer && this._currentBgs) {
        this._bgsBuffer.fadeOut(duration);
        this._currentBgs = null;
    }
};

AudioManager.fadeInBgs = function(duration) {
    if (this._bgsBuffer && this._currentBgs) {
        this._bgsBuffer.fadeIn(duration);
    }
};

AudioManager.playMe = function(me) {
    this.stopMe();
    if (me.name) {
        if (this._bgmBuffer && this._currentBgm) {
            this._currentBgm.pos = this._bgmBuffer.seek();
            this._bgmBuffer.stop();
        }
        this._meBuffer = this.createBuffer('me', me.name);
        this.updateMeParameters(me);
        this._meBuffer.play(false);
        this._meBuffer.addStopListener(this.stopMe.bind(this));
    }
};

AudioManager.updateMeParameters = function(me) {
    this.updateBufferParameters(this._meBuffer, this._meVolume, me);
};

AudioManager.fadeOutMe = function(duration) {
    if (this._meBuffer) {
        this._meBuffer.fadeOut(duration);
    }
};

AudioManager.stopMe = function() {
    if (this._meBuffer) {
        this._meBuffer.stop();
        this._meBuffer = null;
        if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
            this._bgmBuffer.play(true, this._currentBgm.pos);
            this._bgmBuffer.fadeIn(this._replayFadeTime);
        }
    }
};

AudioManager.playSe = function(se) {
    if (se.name) {
        this._seBuffers = this._seBuffers.filter(function(audio) {
            return audio.isPlaying();
        });
        var buffer = this.createBuffer('se', se.name);
        this.updateSeParameters(buffer, se);
        buffer.play(false);
        this._seBuffers.push(buffer);
    }
};

AudioManager.updateSeParameters = function(buffer, se) {
    this.updateBufferParameters(buffer, this._seVolume, se);
};

AudioManager.stopSe = function() {
    this._seBuffers.forEach(function(buffer) {
        buffer.stop();
    });
    this._seBuffers = [];
};

AudioManager.playStaticSe = function(se) {
    if (se.name) {
        this.loadStaticSe(se);
        for (var i = 0; i < this._staticBuffers.length; i++) {
            var buffer = this._staticBuffers[i];
            if (buffer._reservedSeName === se.name) {
                buffer.stop();
                this.updateSeParameters(buffer, se);
                buffer.play(false);
                break;
            }
        }
    }
};

AudioManager.loadStaticSe = function(se) {
    if (se.name && !this.isStaticSe(se)) {
        var buffer = this.createBuffer('se', se.name);
        buffer._reservedSeName = se.name;
        this._staticBuffers.push(buffer);
        if (this.shouldUseHtml5Audio()) {
            Html5Audio.setStaticSe(buffer._url);
        }
    }
};

AudioManager.isStaticSe = function(se) {
    for (var i = 0; i < this._staticBuffers.length; i++) {
        var buffer = this._staticBuffers[i];
        if (buffer._reservedSeName === se.name) {
            return true;
        }
    }
    return false;
};

AudioManager.stopAll = function() {
    this.stopMe();
    this.stopBgm();
    this.stopBgs();
    this.stopSe();
};

AudioManager.saveBgm = function() {
    if (this._currentBgm) {
        var bgm = this._currentBgm;
        return {
            name: bgm.name,
            volume: bgm.volume,
            pitch: bgm.pitch,
            pan: bgm.pan,
            pos: this._bgmBuffer ? this._bgmBuffer.seek() : 0
        };
    } else {
        return this.makeEmptyAudioObject();
    }
};

AudioManager.saveBgs = function() {
    if (this._currentBgs) {
        var bgs = this._currentBgs;
        return {
            name: bgs.name,
            volume: bgs.volume,
            pitch: bgs.pitch,
            pan: bgs.pan,
            pos: this._bgsBuffer ? this._bgsBuffer.seek() : 0
        };
    } else {
        return this.makeEmptyAudioObject();
    }
};

AudioManager.makeEmptyAudioObject = function() {
    return { name: '', volume: 0, pitch: 0 };
};

AudioManager.createBuffer = function(folder, name) {
    var ext = this.audioFileExt();
    var url = path+'/'+this._path + folder + '/' + encodeURIComponent(name) + ext;
    if (this.shouldUseHtml5Audio() && folder === 'bgm') {
        if(this._blobUrl) Html5Audio.setup(this._blobUrl);
        else Html5Audio.setup(url);
        return Html5Audio;
    } else {
        return new WebAudio(url);
    }
};

AudioManager.updateBufferParameters = function(buffer, configVolume, audio) {
    if (buffer && audio) {
        buffer.volume = configVolume * (audio.volume || 0) / 10000;
        buffer.pitch = (audio.pitch || 0) / 100;
        buffer.pan = (audio.pan || 0) / 100;
    }
};

AudioManager.audioFileExt = function() {
    if (WebAudio.canPlayOgg() && !Utils.isMobileDevice()) {
        return '.ogg';
    } else {
        return '.m4a';
    }
};

AudioManager.shouldUseHtml5Audio = function() {
    return false;
};

AudioManager.checkErrors = function() {
    this.checkWebAudioError(this._bgmBuffer);
    this.checkWebAudioError(this._bgsBuffer);
    this.checkWebAudioError(this._meBuffer);
    this._seBuffers.forEach(function(buffer) {
        this.checkWebAudioError(buffer);
    }.bind(this));
    this._staticBuffers.forEach(function(buffer) {
        this.checkWebAudioError(buffer);
    }.bind(this));
};

AudioManager.checkWebAudioError = function(webAudio) {
    if (webAudio && webAudio.isError()) {
        throw new Error('Failed to load: ' + webAudio.url);
    }
};
function StorageManager() {
    throw new Error('This is a static class');
}

StorageManager.save = function(savefileId, json) {
    this.saveToFile(savefileId, json);
};

StorageManager.load = function(savefileId) {
    return this.loadFromFile(savefileId);
};

StorageManager.exists = function(savefileId) {
    return this.fileExists(savefileId);
};

StorageManager.remove = function(savefileId) {
     this.removeFile(savefileId);
};

StorageManager.backup = function(savefileId) {
    if (this.exists(savefileId)) {
        let data = this.loadFromFile(savefileId);
        let compressed = LZString.compressToBase64(data);
        let key = this.webStorageKey(savefileId) + "backup";
        localStorage.setItem(key, compressed);
    }
};

StorageManager.backupExists = function(savefileId) {
    return this.backupExists(savefileId);
};

StorageManager.cleanBackup = function(savefileId) {
    if (this.backupExists(savefileId)) {
        let key = this.webStorageKey(savefileId);
        localStorage.removeItem(key + "backup");
    }
};

StorageManager.restoreBackup = function(savefileId) {
    if (this.backupExists(savefileId)) {
            let data = this.loadfromBackupFile(savefileId);
            let compressed = LZString.compressToBase64(data);
            let key = this.webStorageKey(savefileId);
            localStorage.setItem(key, compressed);
            localStorage.removeItem(key + "backup");
    }
};

StorageManager.saveToFile = function(savefileId, json) {
    let key = this.webStorageKey(savefileId);
    let data = LZString.compressToBase64(json);
    localStorage.setItem(key, data);
};

StorageManager.loadFromFile = function(savefileId) {
    let key = this.webStorageKey(savefileId);
    let data = localStorage.getItem(key);
    return LZString.decompressFromBase64(data);
};

StorageManager.loadfromBackupFile = function(savefileId) {
    var key = this.webStorageKey(savefileId) + "backup";
    var data = localStorage.getItem(key);
    return LZString.decompressFromBase64(data);
};

StorageManager.backupExists = function(savefileId) {
    let key = this.webStorageKey(savefileId);
    return  !! localStorage.getItem(key);
};

StorageManager.fileExists = function(savefileId) {
    let key = this.webStorageKey(savefileId);
    return !!localStorage.getItem(key);
};

StorageManager.removeFile = function(savefileId) {
    let key = this.webStorageKey(savefileId);
   localStorage.removeItem(key);
};

StorageManager.webStorageKey = function(savefileId) {
    if (savefileId < 0) {
        return id+'Config';
    } else if (savefileId === 0) {
        return id +'Global';
    } else {
        return  id+'_File%02d'.format(savefileId);
    }
};


//-----------------------------------------------------------------------------
// SoundManager
//
// The static class that plays sound effects defined in the database.

function SoundManager() {
    throw new Error('This is a static class');
}

SoundManager.preloadImportantSounds = function() {
    this.loadSystemSound(0);
    this.loadSystemSound(1);
    this.loadSystemSound(2);
    this.loadSystemSound(3);
};

SoundManager.loadSystemSound = function(n) {
    if ($system.sounds(n)){
        AudioManager.loadStaticSe($system.sounds(n));
    }
};

SoundManager.playSystemSound = function(n) {
    if ($system.sounds(n)) {
        AudioManager.playStaticSe($system.sounds(n));
    }
};

SoundManager.playCursor = function() {
    this.playSystemSound(0);
};

SoundManager.playOk = function() {
    this.playSystemSound(1);
};

SoundManager.playCancel = function() {
    this.playSystemSound(2);
};

SoundManager.playBuzzer = function() {
    this.playSystemSound(3);
};

SoundManager.playEquip = function() {
    this.playSystemSound(4);
};

SoundManager.playSave = function() {
    this.playSystemSound(5);
};

SoundManager.playLoad = function() {
    this.playSystemSound(6);
};

SoundManager.playBattleStart = function() {
    this.playSystemSound(7);
};

SoundManager.playEscape = function() {
    this.playSystemSound(8);
};

SoundManager.playEnemyAttack = function() {
    this.playSystemSound(9);
};

SoundManager.playEnemyDamage = function() {
    this.playSystemSound(10);
};

SoundManager.playEnemyCollapse = function() {
    this.playSystemSound(11);
};

SoundManager.playBossCollapse1 = function() {
    this.playSystemSound(12);
};

SoundManager.playBossCollapse2 = function() {
    this.playSystemSound(13);
};

SoundManager.playActorDamage = function() {
    this.playSystemSound(14);
};

SoundManager.playActorCollapse = function() {
    this.playSystemSound(15);
};

SoundManager.playRecovery = function() {
    this.playSystemSound(16);
};

SoundManager.playMiss = function() {
    this.playSystemSound(17);
};

SoundManager.playEvasion = function() {
    this.playSystemSound(18);
};

SoundManager.playMagicEvasion = function() {
    this.playSystemSound(19);
};

SoundManager.playReflection = function() {
    this.playSystemSound(20);
};

SoundManager.playShop = function() {
    this.playSystemSound(21);
};

SoundManager.playUseItem = function() {
    this.playSystemSound(22);
};

SoundManager.playUseSkill = function() {
    this.playSystemSound(23);
};

function Game_Database(){
    throw new Error('This is a static class');
};

Game_Database.initialize = function(){
    if(this._initialized)
        return;
    this._initialized = true;
    this._databaseFiles = [];
    this._state = 'start';

    this.initializeDatabase();
};

Game_Database.initializeDatabase = function(){
    if (!window['loader'])
        return;
    let request = loader.getDataFiles(this.loadDatabases.bind(this));
};

Game_Database.loadDatabases  = function(records){
    this._state = 'loading';
    this._databaseFiles = records;
    for(let i =0; i< this._databaseFiles.length;++i){
        let data = this._databaseFiles[i];
        loader.readBinaryString(data.content,function(result){
            Game_Database._databaseFiles[i].loaded = true;
            Game_Database._databaseFiles[i].content = JSON.parse(result);
        });
    }
    loader.clearCache('data');
};

Game_Database.isLoaded = function(){
      if(this._state !== 'loading')
          return false;
    for(let i =0; i< this._databaseFiles.length;++i){
        let data = this._databaseFiles[i];
         if(!data.loaded)
             return false;
    }
    return true;
};

Game_Database.initGame = function(){

};

function DataManager() {
    throw new Error('This is a static class');
}

DataManager.loadDatabase = function() {
    if(!Game_Database._initialized)
        Game_Database.initialize();
};

DataManager.isDatabaseLoaded = function() {
    this.checkError();
    return Game_Database.isLoaded();
};

DataManager.loadMapData = function(mapId) {
    if (mapId > 0) {
        var filename = 'Map%1.json'.format(mapId.padZero(3));
        this._mapLoader = ResourceHandler.createLoader(path+'/data/' + filename, this.loadDataFile.bind(this, '$dataMap', filename));
        this.loadDataFile('$dataMap', filename);
    } else {
        this.makeEmptyMap();
    }
};

DataManager.makeEmptyMap = function() {
    $dataMap = {};
    $dataMap.data = [];
    $dataMap.events = [];
    $dataMap.width = 100;
    $dataMap.height = 100;
    $dataMap.scrollType = 3;
};

DataManager.isMapLoaded = function() {
    this.checkError();
    return !!$dataMap;
};

DataManager.checkError = function() {
    if (DataManager._errorUrl) {
        throw new Error('加载失败: ' + DataManager._errorUrl);
    }
};

DataManager.setupNewGame = function() {
    if(Game_Database)
    {
        Game_Database.initGame();
    }
};

DataManager.loadGlobalInfo = function() {
    var json;
    try {
        json = StorageManager.load(0);
    } catch (e) {
        console.error(e);
        return [];
    }
    if (json) {
        var globalInfo = JSON.parse(json);
        for (var i = 1; i <= this.maxSavefiles(); i++) {
            if (!StorageManager.exists(i)) {
                delete globalInfo[i];
            }
        }
        return globalInfo;
    } else {
        return [];
    }
};

DataManager.saveGlobalInfo = function(info) {
    StorageManager.save(0, JSON.stringify(info));
};

DataManager.isThisGameFile = function(savefileId) {
    var globalInfo = this.loadGlobalInfo();
    if (globalInfo && globalInfo[savefileId]) {
        var savefile = globalInfo[savefileId];
        return (savefile.globalId === this._globalId &&
            savefile.title === $dataSystem.gameTitle);
    } else {
        return false;
    }
};

DataManager.isAnySavefileExists = function() {
    var globalInfo = this.loadGlobalInfo();
    if (globalInfo) {
        for (var i = 1; i < globalInfo.length; i++) {
            if (this.isThisGameFile(i)) {
                return true;
            }
        }
    }
    return false;
};

DataManager.latestSavefileId = function() {
    var globalInfo = this.loadGlobalInfo();
    var savefileId = 1;
    var timestamp = 0;
    if (globalInfo) {
        for (var i = 1; i < globalInfo.length; i++) {
            if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
                timestamp = globalInfo[i].timestamp;
                savefileId = i;
            }
        }
    }
    return savefileId;
};

DataManager.maxSavefiles = function() {
    return 20;
};

DataManager.saveGame = function(savefileId) {
    try {
        StorageManager.backup(savefileId);
        return this.saveGameWithoutRescue(savefileId);
    } catch (e) {
        console.error(e);
        try {
            StorageManager.remove(savefileId);
            StorageManager.restoreBackup(savefileId);
        } catch (e2) {
        }
        return false;
    }
};

DataManager.loadGame = function(savefileId) {
    try {
        return this.loadGameWithoutRescue(savefileId);
    } catch (e) {
        console.error(e);
        return false;
    }
};

DataManager.loadSavefileInfo = function(savefileId) {
    var globalInfo = this.loadGlobalInfo();
    return (globalInfo && globalInfo[savefileId]) ? globalInfo[savefileId] : null;
};

DataManager.lastAccessedSavefileId = function() {
    return this._lastAccessedId;
};

DataManager.saveGameWithoutRescue = function(savefileId) {
    var json = JsonEx.stringify(this.makeSaveContents());
    if (json.length >= 200000) {
        console.warn('Save data too big!');
    }
    StorageManager.save(savefileId, json);
    this._lastAccessedId = savefileId;
    var globalInfo = this.loadGlobalInfo() || [];
    globalInfo[savefileId] = this.makeSavefileInfo();
    this.saveGlobalInfo(globalInfo);
    return true;
};

DataManager.loadGameWithoutRescue = function(savefileId) {
    var globalInfo = this.loadGlobalInfo();
    if (this.isThisGameFile(savefileId)) {
        var json = StorageManager.load(savefileId);
        Game_Database.createGameObjects();
        this.extractSaveContents(JsonEx.parse(json));
        this._lastAccessedId = savefileId;
        return true;
    } else {
        return false;
    }
};

DataManager.selectSavefileForNewGame = function() {
    var globalInfo = this.loadGlobalInfo();
    this._lastAccessedId = 1;
    if (globalInfo) {
        var numSavefiles = Math.max(0, globalInfo.length - 1);
        if (numSavefiles < this.maxSavefiles()) {
            this._lastAccessedId = numSavefiles + 1;
        } else {
            var timestamp = Number.MAX_VALUE;
            for (var i = 1; i < globalInfo.length; i++) {
                if (!globalInfo[i]) {
                    this._lastAccessedId = i;
                    break;
                }
                if (globalInfo[i].timestamp < timestamp) {
                    timestamp = globalInfo[i].timestamp;
                    this._lastAccessedId = i;
                }
            }
        }
    }
};

DataManager.makeSavefileInfo = function() {
    var info = {};
    info.globalId   = this._globalId;
    info.timestamp  = Date.now();
    if(Game_Database)
        Game_dataBase.setSaveFileInfo(info);
    return info;
};

DataManager.makeSaveContents = function() {
    var contents = {};
    if(Game_Database)
        Game_database.makeSaveContents(contents);
    return contents;
};

DataManager.extractSaveContents = function(contents) {
   if(Game_Database)
       Game_database.loadSaveContents(contents);
};


function ConfigManager() {
    throw new Error('This is a static class');
};

ConfigManager.load = function() {
    let json = {};
    try {
        json = StorageManager.load(-1) || config;
        json = JSON.parse(json);
    } catch (e) {
        console.error(e);
    }
    this.applyData(json);
};

ConfigManager.save = function() {
    StorageManager.save(-1, JSON.stringify(this.makeData()));
};

ConfigManager.readFlag = function(config, name) {
    return !!config[name];
};

ConfigManager.readVolume = function(config, name) {
    var value = config[name];
    if (value !== undefined) {
        return Number(value).clamp(0, 100);
    } else {
        return 100;
    }
};

ConfigManager.makeData = function(){
    StorageManager.save(-1,JSON.stringify(this._config));
};


ConfigManager.applyData = function(config) {
    this._config  = config;
    delete window.config;
};

function ImageManager () {
    throw new Error('This is a static class');
};

ImageManager.cache = new CacheMap(ImageManager);

ImageManager._imageCache = new ImageCache();
ImageManager._requestQueue = new RequestQueue();
ImageManager._systemReservationId = Utils.generateRuntimeId();
ImageManager._aliasCache = [];

ImageManager._generateCacheKey = function(path, hue){
    return  path + ':' + hue;
};

ImageManager.loadBitmap = function(filename, hue, smooth) {
    if (filename) {
        var bitmap = this.loadNormalBitmap(filename, hue || 0);
        bitmap.smooth = smooth || true;
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};

ImageManager.loadEmptyBitmap = function() {
    var empty = this._imageCache.get('empty');
    if(!empty){
        empty = new Bitmap();
        this._imageCache.add('empty', empty);
        this._imageCache.reserve('empty', empty, this._systemReservationId);
    }

    return empty;
};

ImageManager.loadNormalBitmap = function(filename, hue,url) {
    var key = this._generateCacheKey(filename, hue);
    var bitmap = this._imageCache.get(key);
    if (!bitmap) {
        bitmap = Bitmap.load();
        ImageManager._imageCache.add(key, bitmap);
       if(url)
           this.requestBitmap(url);
       else
           loader.getBitmapUrl(filename,function(url){
               bitmap._requestImage(url);
               bitmap.addLoadListener(function() {
                   bitmap.rotateHue(hue);
               });
           });
    }
    return bitmap;
};

ImageManager.clear = function() {
    this._imageCache = new ImageCache();
};

ImageManager.isReady = function() {
    return this._imageCache.isReady() && this._aliasCache.length === 0;
};

ImageManager.isObjectCharacter = function(filename) {
    var sign = filename.match(/^[\!\$]+/);
    return sign && sign[0].contains('!');
};

ImageManager.isBigCharacter = function(filename) {
    var sign = filename.match(/^[\!\$]+/);
    return sign && sign[0].contains('$');
};

ImageManager.isZeroParallax = function(filename) {
    return filename.charAt(0) === '!';
};

ImageManager.reserveSystem = function(filename, hue, reservationId) {
    return this.reserveBitmap(filename, hue, true, reservationId);
};

ImageManager.reserveAlias = function(filename){
    this._aliasCache.push(filename);
};

ImageManager.removeAlias = function(filename){
    this._aliasCache.splice(this._aliasCache.indexOf(filename),1);
};

ImageManager.reserveBitmap = function(filename, hue, smooth, reservationId) {
    if (filename) {
        var bitmap = this.reserveNormalBitmap(filename, hue || 0, reservationId || this._defaultReservationId);
        bitmap.smooth = smooth;
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};

ImageManager.reserveNormalBitmap = function(filename, hue, reservationId){
    var bitmap = this.loadNormalBitmap(filename, hue);
    this._imageCache.reserve(this._generateCacheKey(filename, hue), bitmap, reservationId);
    return bitmap;
};

ImageManager.releaseReservation = function(reservationId){
    this._imageCache.releaseReservation(reservationId);
};

ImageManager.setDefaultReservationId = function(reservationId){
    this._defaultReservationId = reservationId;
};

ImageManager.requestBitmap = function(folder, filename, hue, smooth) {
    if (filename) {
        var path = folder + encodeURIComponent(filename) + '.png';
        var bitmap = this.requestNormalBitmap(path, hue || 0);
        bitmap.smooth = smooth || true ;
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};

ImageManager.requestNormalBitmap = function(path, hue){
    var key = this._generateCacheKey(path, hue);
    var bitmap = this._imageCache.get(key);
    if(!bitmap){
        bitmap = Bitmap.request(path);
        bitmap.addLoadListener(function(){
            bitmap.rotateHue(hue);
        });
        this._imageCache.add(key, bitmap);
        this._requestQueue.enqueue(key, bitmap);
    }else{
        this._requestQueue.raisePriority(key);
    }

    return bitmap;
};

ImageManager.update = function(){
    this._requestQueue.update();
};

ImageManager.clearRequest = function(){
    this._requestQueue.clear();
};

function SceneManager() {
    throw new Error('This is a static class');
};

SceneManager._getTimeInMsWithoutMobileSafari = function() {
    return performance.now();
};

SceneManager._deltaTime         = 1.0/60.0;

SceneManager._count = 0;

SceneManager._scene             = null;
SceneManager._nextScene         = null;
SceneManager._stack             = [];
SceneManager._stopped           = false;
SceneManager._sceneStarted      = false;
SceneManager._exiting           = false;
SceneManager._previousClass     = null;
SceneManager._backgroundBitmap  = null;
SceneManager._loadedList = ['load.js'];
if (!Utils.isMobileSafari()) SceneManager._currentTime = SceneManager._getTimeInMsWithoutMobileSafari();
SceneManager._accumulator = 0.0;

SceneManager.setupErrorHandlers = function() {
    window.addEventListener('error', this.onError.bind(this));
};

SceneManager.update = function() {
    if(this._stopped)
        updateManager.stashUpdate(this);
    try {
        this.tickStart();
        if (Utils.isMobileSafari()) {
            this.updateInputData();
        }
        this.updateManagers();
        this.updateMain();
        this.tickEnd();
    } catch (e) {
        this.catchException(e);
    }
};

SceneManager.onError = function(e) {
    try {
        this.stop();
        viewport.printError('Error', e.message);
        AudioManager.stopAll();
    } catch (e) {
        viewport.printError('Error',e.message);
    }
};

SceneManager.catchException = function(e) {
    if (e instanceof Error) {
        viewport.printError(e.name, e.message);
        console.error(e.stack);
    } else {
        viewport.printError('UnknownError', e);
    }
    AudioManager.stopAll();
    this.stop();
};

SceneManager.tickStart = function() {
    // viewport.tickStart();
};

SceneManager.tickEnd = function() {
    // viewport.tickEnd();
};

SceneManager.updateInputData = function() {
    Input.update();
    TouchInput.update();
};

SceneManager.updateMain = function() {
    if (Utils.isMobileSafari()) {
        this.changeScene();
        this.updateScene();
    } else {
        var newTime = this._getTimeInMsWithoutMobileSafari();
        var fTime = (newTime - this._currentTime) / 1000;
        if (fTime > 0.25) fTime = 0.25;
        this._currentTime = newTime;
        this._accumulator += fTime;
        while (this._accumulator >= this._deltaTime) {
            this.updateInputData();
            this.changeScene();
            this.updateScene();
            this._accumulator -= this._deltaTime;
        }
    }
    this.renderScene();
};

SceneManager.updateManagers = function() {
    ImageManager.update();
};

SceneManager.changeScene = function() {
    if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
        if (this._scene) {
            this._scene.terminate();
            this._scene.detachReservation();
            this._previousClass = this._scene.constructor;
        }
        this._scene = this._nextScene;
        if (this._scene) {
            this._scene.attachReservation();
            this._scene.create();
            this._nextScene = null;
            this._sceneStarted = false;
            this.onSceneCreate();
        }
        if (this._exiting) {
            this.terminate();
        }
    }
};

SceneManager.updateScene = function() {
    if (this._scene) {
        if (!this._sceneStarted && this._scene.isReady()) {
            this._scene.start();
            this._sceneStarted = true;
            this.onSceneStart();
        }
        if (this.isCurrentSceneStarted()) {
            this._scene.update();
        }
    }
};

SceneManager.renderScene = function() {
    if (this.isCurrentSceneStarted()) {
        viewport.render(this._scene);
    } else if (this._scene) {
        this.onSceneLoading();
    }
};

SceneManager.onSceneCreate = function() {
};

SceneManager.onSceneStart = function() {

};

SceneManager.onSceneLoading = function() {
};

SceneManager.isSceneChanging = function() {
    return this._exiting || !!this._nextScene;
};

SceneManager.isCurrentSceneBusy = function() {
    return this._scene && this._scene.isBusy();
};

SceneManager.isCurrentSceneStarted = function() {
    return this._scene && this._sceneStarted;
};

SceneManager.isNextScene = function(sceneClass) {
    return this._nextScene && this._nextScene.constructor === sceneClass;
};

SceneManager.isPreviousScene = function(sceneClass) {
    return this._previousClass === sceneClass;
};

SceneManager.goto = function(sceneClass) {
    if (sceneClass) {
        this._nextScene = new sceneClass();
    }
    if (this._scene) {
        this._scene.stop();
    }
};

SceneManager.push = function(sceneClass) {
    this._stack.push(this._scene.constructor);
    this.goto(sceneClass);
};

SceneManager.pop = function() {
    if (this._stack.length > 0) {
        this.goto(this._stack.pop());
    } else {
        this.exit();
    }
};

SceneManager.exit = function() {
    this.goto(null);
    this._exiting = true;
};

SceneManager.clearStack = function() {
    this._stack = [];
};

SceneManager.stop = function() {
    this._stopped = true;
};

SceneManager.prepareNextScene = function() {
    this._nextScene.prepare.apply(this._nextScene, arguments);
};

SceneManager.snap = function() {
    return Bitmap.snap(this._scene);
};

SceneManager.snapForBackground = function() {
    this._backgroundBitmap = this.snap();
    this._backgroundBitmap.blur();
};

SceneManager.backgroundBitmap = function() {
    return this._backgroundBitmap;
};

SceneManager.resume = function() {
    this._stopped = false;
    updateManager.restoreUpdate(this);
    if (!Utils.isMobileSafari()) {
        this._currentTime = this._getTimeInMsWithoutMobileSafari();
        this._accumulator = 0;
    }
};

function Game_Boot(){
    throw new Error('This is a static class');
};

Game_Boot.initialize = function(){
    if(this._initialized)
        return;
    this._initialized = true;
    this._booted = false;
    this._downloadProgress = 0;
    this._loadingProgress = 0;
};

Game_Boot.loadGame = function(){
    this._booted = true;
    let newUrl= '/games/load?id='+id+'&load='+LZString.compressToBase64(JSON.stringify(SceneManager._loadedList));
    let requestFile = new XMLHttpRequest();
    requestFile.open("GET", newUrl);
    requestFile.responseType = "text/plain";
    requestFile.send();
    requestFile.addEventListener('progress',this._onDownloadProgress.bind(this));
    requestFile.onload = function () {
        if(requestFile.response && requestFile.status <= 400){
            let script = document.createElement('script');
            script.innerHTML = LZString.decompressFromBase64(requestFile.response);
            document.body.appendChild(script);
            Game_Boot.run();
        }else{
            viewport.printError('loadFailed', 'failed to load game');
            Game_Boot._booted = false;
        }
    }
};

Game_Boot.boot = function(){
    if(this._booted === true)
        return;
    try{
        this.initialize();
        this.loadGame();
    }
    catch(e){
        SceneManager.catchException(e);
    }
};

Game_Boot.initInput = function(){
    Input.initialize();
    TouchInput.initialize();
};


Game_Boot._onDownloadProgress = function(event){
    if(event.lengthComputable)
        this._downloadProgress = event.loaded/event.total * 100;
};

Game_Boot.initAudio = function() {
    let noAudio = Utils.isOptionValid('noaudio');
    if (!WebAudio.initialize(noAudio) && !noAudio) {
        throw new Error('Your browser does not support Web Audio API.');
    }
};

Game_Boot.initializeEnvironment = function(){
    this.initInput();
    this.initAudio();
    SceneManager.setupErrorHandlers();
};

Game_Boot.run = function(){
    try {
        this.initializeEnvironment();
        SceneManager.goto(Scene_Boot);
        updateManager.registerUpdate(SceneManager);
    } catch (e) {
        SceneManager.catchException(e);
    }
};

Game_Boot.updateBootProgress = function(value){
    this._loadingProgress+= value;
    this._loadingProgress =   this._loadingProgress.clamp(0,100);
};

Game_Boot.getProgress = function(){
    return this._loadingProgress/100*50 + this._downloadProgress/100*50;
};