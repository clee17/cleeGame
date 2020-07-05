function DisplayPort() {
    this.initialize.apply(this, arguments);
}

DisplayPort.prototype = Object.create(PIXI.Container.prototype);
DisplayPort.prototype.constructor = DisplayPort;

DisplayPort.prototype.initialize = function() {
    PIXI.Container.call(this);
    this._width = 945;
    this._height = 471;

    this._nextMapIndex = null;
    this._padding = 18;
    this._fading = true;
    this._fadeSign = -1;
    this._maxStay = 40;
    this._colorTone = [0, 0, 0];
    this._mainBackSprite = null;
    this._createAllParts();
    this.x = (viewport.width-947)/2;
    this.y = (viewport.height - 471)*0.4;
    this.active = true;
    this.initializeMap();
    this.startFadeIn();
};

Object.defineProperty(DisplayPort.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        this._width = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(DisplayPort.prototype, 'height', {
    get: function() {
        return this._height;
    },
    set: function(value) {
        this._height = value;
        this._refreshAllParts();
    },
    configurable: true
});

DisplayPort.prototype._createAllParts = function() {
    ImageManager.reserveBitmap('mapTile');
    this._backSprite = new Sprite('mainBg');
    this._frame = new Sprite();
    this._frameTexture = ImageManager.loadBitmap('frame.png');
    this._frameTexture.addLoadListener(this._onFrameLoaded.bind(this));
    this._fadeSprite = new Sprite(new Bitmap(947,471,'none'));
    this._fadeSprite.bitmap.fillAll('rgba(255,255,255,1)');
    this._map = new Map_Display(GameManager.getCurrentMap().index);
    this._alertSign = new Sprite(new Bitmap(947,28,'none'));
    this._alertSign.anchor.y = 1;
    this._alertSign.move(0,-15);
    this._alertSign.bitmap.clear();
    this.addChild(this._backSprite);
    this.addChild(this._map);
    this.addChild(this._fadeSprite);
    this.addChild(this._frame);
    this.addChild(this._alertSign);

};

DisplayPort.prototype.initializeMap = function(){
    let mapIndex = GameManager.getCurrentMap();
    this._map.changeMap(mapIndex.index,this.completeMapLoad.bind(this));
    this._mapIndex = mapIndex;
};

DisplayPort.prototype.completeMapLoad = function(){
    this.startFadeIn();
};

DisplayPort.prototype._onFrameLoaded = function(){

};

DisplayPort.prototype.startFadeIn = function(){
    this._fading = true;
    this._fadeSign = -1;
};

DisplayPort.prototype.startFadeOut = function(){
    this._fading = true;
    this._fadeSign = 1;
};

DisplayPort.prototype.startMapChange = function(){
    this.startFadeOut();
};

DisplayPort.prototype.updateMap = function(){
    if(GameManager._mapUpdated && GameManager.getCurrentMap().index !== this._mapIndex){
        this._nextMapIndex = GameManager.getCurrentMap();
    }
    if(this._nextMapIndex!= null && !SceneManager.isCurrentSceneBusy()){
        if(this._mapIndex.index === this._nextMapIndex.index){
            this._nextMapIndex = null;
            return;
        }
        this._mapIndex = this._nextMapIndex;
        this._nextMapIndex = null;
        this.startMapChange();
    }
};

DisplayPort.prototype.updateFade = function(){
    if(this._fading){
        this._fadeSprite.opacity += this._fadeSign*12;
    }
    if(this._fadeSign>0 && this._fadeSprite.opacity >= 255 && this._fading){
        this._fading = false;
        this.initializeMap();
    }
    else if (this._fadeSign <0 && this._fadeSprite.opacity <= 0 && this._fading){
        this._fading = false;
    }
};

DisplayPort.prototype.update = function() {
    this.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
    this.updateMap();
    this.updateFade();
};

DisplayPort.prototype.updateInputEvent = function(){
    this._map.updateInputEvent();
}

DisplayPort.prototype.isBusy = function(){
    return this._fading;
};