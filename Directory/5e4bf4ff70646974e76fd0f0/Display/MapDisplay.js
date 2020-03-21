function Map_Display() {
    this.initialize.apply(this, arguments);
}

Map_Display.prototype = Object.create(PIXI.Container.prototype);
Map_Display.prototype.constructor = Map_Display;

Map_Display.prototype.initialize = function(mapIndex) {
    PIXI.Container.call(this);
    this._width = 945;
    this._height = 471;
    this._buttons  = {};
    this._mapMatrix = [];
    this._size = {width:0,height:0};
    this._exitPoint = -1;
    this._endPoint = -1;
    this._playerStay = 0;
    this._maxPlayerStay = 15;
    this._currentRoute = [];
    this._mapIndex = mapIndex;
    this._createAllParts();
    this.x =0;
    this.y = 0;
    this.active = true;
    this.openness = 255;
    this.checkButtonStatus();
    this.loadMap();
};

Object.defineProperty(Map_Display.prototype, 'contents', {
    get: function() {
        return this._fadeSprite.bitmap;
    },
    set: function(value) {
        this._fadeSprite.bitmap = value;
    },
    configurable: true
});


Object.defineProperty(Map_Display.prototype, 'size', {
    get: function() {
        return this._size;
    },
    set: function(value) {
        this._size = value;
    },
    configurable: true
});

Map_Display.prototype._createAllParts = function() {
    let buttons = Game_Database.getMap(0).buttons || [];
    this._mainBackground = new Sprite('Map000');
    this._buttonContainer = new Sprite(new Bitmap(this._width,this._height,'none'));
    this._buttonContainer.bitmap.clear();
    this._buttonContainer.width = this._width;
    this._buttonContainer.height = this._height;
    this._tileMapContainer = new PIXI.Container();
    this._tileContainer = new PIXI.Container();
    this._tileContainer.x = 20;
    this._tileContainer.y = 25;
    this._tileMapContainer.alpha = 0;
    this._player = new Sprite_Player();
    this._player._location = {x:0,y:0,posX:50,posY:55,index:0};
    this.refreshPlayer();
    for(let i=0; i < buttons.length;++i){
        this._buttons[buttons[i].symbol] = new Button_Map(buttons[i].refer+'.png',buttons[i].symbol);
        this._buttons[buttons[i].symbol].move(buttons[i].pos.x,buttons[i].pos.y);
        this._buttons[buttons[i].symbol].setName(buttons[i].name);
        this._buttons[buttons[i].symbol].setFontSize(14);
        this._buttons[buttons[i].symbol].setNameArea(22,-16);
        this._buttonContainer.addChild(this._buttons[buttons[i].symbol]);
    }
    this.addChild(this._mainBackground);
    this.addChild(this._buttonContainer);
    this._tileMapContainer.addChild(this._tileContainer);
    this._tileMapContainer.addChild(this._player);
    this.addChild(this._tileMapContainer);
};


Map_Display.prototype.checkMapCondition = function(attr){
    let result = true;
    let mapInfo = Game_Database.getMap(Number(attr));
    let conditions = mapInfo.condition;
    for(let attr in conditions){
        let value = GameManager.getValue(attr);
       if(!Game_Database.compareValue(value,conditions[attr]))
           result = false;
    }
    return result;
};

Map_Display.prototype.checkButtonStatus = function(){
    for(let attr in this._buttons){
        if(this._buttons[attr]){
            this._buttons[attr].setEnabled(this.checkMapCondition(attr));
        }
    }
};

Map_Display.prototype.updateButtonStatus = function(){
    if(GameManager._playerUpdated){
        this.checkButtonStatus();
    }
};

Map_Display.prototype.updateButtons = function(){
    this._buttonContainer.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};


Map_Display.prototype.getTilePos = function(x,y){
    let posX = Math.floor(x/60);
    let posY = Math.floor(y/60);
    return {x:posX,y:posY,index:15*posY+posX};
};

Map_Display.prototype.getTileTarget = function(index){
    let x = Math.floor(index %this.size.width);
    let y = Math.floor(index/this.size.width);
    return {x:x,y:y,posX:x*60+50,posY:y*60+55,index:index};
};

Map_Display.prototype.refreshPlayer = function(){
    this._player.x = this._player._location.posX;
    this._player.y = this._player._location.posY;
};

Map_Display.prototype.movePlayer = function(){
    if(this._currentRoute.length === 0)
        return;
    this._playerStay++;
    if(this._playerStay >= this._maxPlayerStay){
        let next = this._currentRoute.shift();
        this._player._location = this.getTileTarget(next);
        this.refreshPlayer();
        this.refreshMove();
        this.checkExitPoint();
        this.checkMapEvent();
        this._playerStay = 0;
    }
};

Map_Display.prototype.refreshMove = function(){
    let currentIndexX = Math.floor((this._player.x - 50)/60);
    let currentIndexY = Math.floor((this._player.y - 55)/60);
    let mapIndex = currentIndexY * this.size.width + currentIndexX;
    let tileId = this._mapMatrix[mapIndex]._tileId;
    let tileInfo = Game_Database.getData('tile',tileId);
    let status  = GameManager.moveStep(tileInfo);
    if(status.step <= 0){
        GameManager.failMapEvent();
    }
};



Map_Display.prototype.updateExitAnimate = function(index,show){
    let tileId = this._mapMatrix[index]._tileId;
    if(tileId === 4 && show){
        this._mapMatrix[this._exitPoint]._tileId = 5;
        this.showTileTexture(index,5);
    }else if (tileId === 5 && !show){
        this._mapMatrix[this._exitPoint]._tileId = 4;
        this.showTileTexture(this._exitPoint,4);
    }
};

Map_Display.prototype.checkExitPoint = function(){
    let index = this._player._location.index;
    let tileId = this._mapMatrix[index]._tileId;
    if(index === this._exitPoint){
        this._currentRoute = [];
        this._player.opacity = 5;
        GameManager.endMapEvent();
    }else this._player.opacity = 255;
    this.updateExitAnimate(this._exitPoint,index === this._exitPoint);
};

Map_Display.prototype.checkMapEvent = function(){
    let currentIndexX = Math.floor((this._player.x - 50)/60);
    let currentIndexY = Math.floor((this._player.y - 55)/60);
    let mapIndex = currentIndexY * this.size.width + currentIndexX;
    let tileId = this._mapMatrix[mapIndex]._tileId;
    let tileInfo = Game_Database.getData('tile',tileId);
    if(tileInfo.type !== "normal"){
        let map = Game_Database.getData('map',this._mapIndex);
        let info = Game_Database.getData('mapinfo',map.info);
        this._player.shock();
        this._currentRoute = [];
        if(tileInfo.type === 'treasure'){

        }else if (tileInfo.type === 'events'){

        }else if (tileInfo.type === 'special'){

        }
    }
};

Map_Display.prototype.movable = function(direction){
    if(GameManager.isTalkEvent())
        return false;
    let step = 1;
    if(direction === 'up')
        step = -(this.size.width);
    else if (direction === 'left')
        step = -1;
    else if (direction === 'down')
        step = this.size.width;
    let currentIndexX = Math.floor((this._player.x - 50)/60);
    let currentIndexY = Math.floor((this._player.y - 55)/60);
    let maxIndex = currentIndexY * this.size.width + currentIndexX;
    if(maxIndex+step<0)
        return false;
    return !!this._mapMatrix[maxIndex + step];
};


Map_Display.prototype.canvasToMapX = function(x) {
    var node = this._tileContainer;
    while (node) {
        x -= node.x;
        node = node.parent;
    }
    return x;
};

Map_Display.prototype.canvasToMapY = function(y) {
    var node = this._tileContainer;
    while (node) {
        y -= node.y;
        node = node.parent;
    }
    return y;
};

Map_Display.prototype.isMapTouched = function(){
    let x = this.canvasToMapX(TouchInput.x);
    let y = this.canvasToMapY(TouchInput.y);
    return x >= 0 && y >= 0 && x < this._tileContainer.width && y < this._tileContainer.height;
};

Map_Display.prototype.getCurrentLocation = function(){
    return this._player._location.index;
};

Map_Display.prototype.updatePlayerTouch = function(){
    if(GameManager.isTalkEvent())
        return;
    if (TouchInput.isTriggered() && this.isMapTouched()) {
        this._touching = true;
    }
    if(TouchInput.isReleased()){
        if(this._touching && this.isMapTouched()){
            this._touching = false;
            let x =  this.canvasToMapX(TouchInput.x);
            let y =  this.canvasToMapY(TouchInput.y);
            let targetPos = this.getTilePos(x,y);
            if(this._mapMatrix[targetPos.index]){
                let map = Game_Database.getData('map',this._mapIndex);
                let info = Game_Database.getData('mapinfo',map.info);
                this._currentRoute = AStar.searchMap4(this.getCurrentLocation(),targetPos.index,this.size,info.map);
                this._playerStay  = this._maxPlayerStay;
            }
            if(this._blockTouch)
                TouchInput._released = false;
        }
    }
};

Map_Display.prototype.updateInput = function(){
    if(this._mapIndex === 0)
        return;
    if(GameManager.isTalkEvent())
        return;
    if (Input.isRepeated('down') && this.movable('down')) {
        let current = this._player._location.index;
        this._currentRoute = [this._player._location.index+this.size.width];
        this._playerStay  = this._maxPlayerStay;
    }
    if (Input.isRepeated('up') && this.movable('up')) {
        this._currentRoute = [this._player._location.index-this.size.width];
        this._playerStay  = this._maxPlayerStay;
    }
    if (Input.isRepeated('right') && this.movable('right')) {
        this._currentRoute = [this._player._location.index+1];
        this._playerStay  = this._maxPlayerStay;
    }
    if (Input.isRepeated('left') && this.movable('left')) {
        this._currentRoute = [this._player._location.index-1];
        this._playerStay  = this._maxPlayerStay;
    }
};


Map_Display.prototype.updateTouch = function(){
    if(this._mapIndex === 0)
        this.updateButtons();
    else
        this.updatePlayerTouch();
};

Map_Display.prototype.update = function() {
    this.updateButtonStatus();
    if(!GameManager.isTalkEvent() && GameManager.getCurrentMap().index === this._mapIndex && this._mapIndex>0){
        this._player.update();
        this.movePlayer();
    }
    this.updateTouch();
    this.updateInput();
};

Map_Display.prototype.getTile = function(tileList){
    let random = Math.randomInt(100);
    let max = 0;
    for(let i=0; i <tileList.length;++i){
        max += tileList[i].rate;
        if(random <= max){
            return tileList[i];
        }
    }
};

Map_Display.prototype.createTileMap = function(){
    let mapInfo = Game_Database.getData('map',this._mapIndex);
    let info = Game_Database.getData('mapinfo',mapInfo.info);
    if(!info)
        return;
    this.size = info.size;
    let specialTile = {};
    for(let i=0;i<info.map.length;++i){
        let index = info.map[i];
        if(index){
            let tile = this.getTile(info.tile);
            if(specialTile[tile.index.toString()] === undefined && tile.max)
                specialTile[tile.index.toString()] = 0;
            while(tile.max && specialTile[tile.index.toString()] && specialTile[tile.index.toString()] >= tile.max){
                tile = this.getTile(info.tile);
            }
            if(tile.max)
                specialTile[tile.index.toString()]++;
            let tileInfo = Game_Database.getData('tile',tile.index);
            this._mapMatrix[i] = new Sprite('mapTile');
            let x = i%15;
            let y = Math.floor(i/15);
            this.showTileTexture(i,tileInfo.textureIndex);
            this._mapMatrix[i]._tileId = tile.index;
            this._mapMatrix[i].move(x*60,y*60);
            this._tileContainer.addChild(this._mapMatrix[i]);
        }else this._mapMatrix[i] = null;
    }
};

Map_Display.prototype.isEndOK = function(end){
    if(end === this._startPoint)
        return false;
    return !!this._mapMatrix[end];
};

Map_Display.prototype.showTileTexture = function(tileIndex,textureId){
    let frameX = textureId%5;
    let frameY = Math.floor(textureId/5);
    this._mapMatrix[tileIndex].setFrame(frameX*60,frameY*60,60,60);
};

Map_Display.prototype.changeTile = function(index,tileId){
    let tile = Game_Database.getData('tile',tileId);
    let frameX = tile.textureIndex%5;
    let frameY = Math.floor(tile.textureIndex/5);
    if(!this._mapMatrix[index])
        this._mapMatrix[index] = new Sprite('mapTile');
    this._mapMatrix[index]._tileId = tileId;
    this._mapMatrix[index].setFrame(60*frameX,60*frameY,60,60);
};

Map_Display.prototype.createExitPoint = function(){
    let exitPoint = Math.randomInt(this._mapMatrix.length);
    while(!this.isEndOK(exitPoint)){
        exitPoint = Math.randomInt(this._mapMatrix.length);
    }
    this._exitPoint = exitPoint;
    this.changeTile(exitPoint,4);
};

Map_Display.prototype.initializePlayer = function(){
    let map = Game_Database.getData('map',this._mapIndex);
    let mapInfo = Game_Database.getData('mapinfo',map.info);
    let start =  this._startPoint = mapInfo.playerStart !== undefined ? mapInfo.playerStart : 0;
    this._player._location = this.getTileTarget(start);
    this._player.normal();
    this.refreshPlayer();
    this.changeTile(start,mapInfo.defaultTile);
};

Map_Display.prototype.loadMap = function(callback){
    if(this._mapIndex === 0){
        this._tileContainer.removeChildren();
        this._mapMatrix = [];
        this._buttonContainer.alpha = 1;
        this._mainBackground.alpha = 1;
        this._player.alpha = 0;
        if(callback)
           callback();
    }else {
        this._mainBackground.alpha = 0;
        this._buttonContainer.alpha = 0;
        this._tileMapContainer.alpha = 1;
        this._player.alpha = 1;
        this.createTileMap();
        this.initializePlayer();
        this.createExitPoint();
        GameManager.loadChallenge();
        if(callback)
           callback();
    }
};

Map_Display.prototype.changeMap = function(index,callback){
    if(this._mapIndex !== index){
        this._mapIndex = index;
        this.loadMap(callback);
    }else{
        callback();
    }
};