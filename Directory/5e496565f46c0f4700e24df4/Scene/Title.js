function Scene_Title() {
    this.initialize.apply(this, arguments);
};

Scene_Title.prototype = Object.create(Scene_Base.prototype);
Scene_Title.prototype.constructor = Scene_Title;

Scene_Title.prototype.createScene = function() {
    this._backSprite1 =  new Sprite('scene000.png');
    this._backSprite1.anchor.x = 0;
    this.addChild(this._backSprite1);
};

Scene_Title.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    Game_Boot.updateBootProgress(30);
    this.createScene();
};

Scene_Title.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._sceneId = 'Scene_Title';
    this._started = false;
    this._active = false;
};

Scene_Title.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
};

Scene_Title.prototype.playTitleMusic = function() {

};

Scene_Title.prototype.onClick = function(x,y){
    this._backSprite1._dragged = true;
    this._savedClick = {x:x,y:y};
};

Scene_Title.prototype.onMove = function(x,y){
    if(this._backSprite1._dragged)
    {
        let offsetX = x - this._savedClick.x;
        if(this._backSprite1.x + offsetX <= 0 && this._backSprite1.x +offsetX >= viewport.width- this._backSprite1.width)
        {
            this._backSprite1.x += offsetX;
            this._savedClick.x = x;
        }

    }

};
Scene_Title.prototype.onUp = function(x,y){
    this._backSprite1._dragged = false;
    this._backSprite1._originPosition = null;
};

Scene_Title.prototype.positionElement = function(){
    this._backSprite1.x = viewport.width/2 -  this._backSprite1.width/2;
};

Scene_Title.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    Game_Boot.updateBootProgress(20);
    this.positionElement();
    viewport.endLoading();
    TouchInput.registerTriggerEvent(this.onClick.bind(this));
    TouchInput.registerMoveEvent(this.onMove.bind(this));
    TouchInput.registerReleaseEvent(this.onUp.bind(this));
    this._started = true;
};


Scene_Title.prototype.isStarted = function(){
    return this._started;
};