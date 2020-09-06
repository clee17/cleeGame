function Scene_Options() {
    this.initialize.apply(this, arguments);
};

Scene_Options.prototype = Object.create(Scene_Base.prototype);
Scene_Options.prototype.constructor = Scene_Options;

Scene_Options.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this._backSprite1 =  new Sprite('starrySky.png');
    this._backSprite1._parallax = new TilingSprite('building.png',viewport.width,250);
    let parallax = this._backSprite1._parallax;
    parallax.anchor.x = 0;
    parallax.anchor.y = 1;
    parallax.x = 0;
    parallax.y = viewport.height;
    parallax.tilePosition.x = 150;
    this._backSprite1.addChild(parallax);
    this.addChild(this._backSprite1);
    this._returnButton  =new Sprite_Button(new Rectangle(0,0,150,60),'return');
    this._returnButton.setEvent(this.cancelPage.bind(this));
    this._returnButton.setFontSize(35);
    this._returnButton.setName("返回");
    this._returnButton.setNormalColor('rgba(255,255,255,0.8)','rgba(148,187,248,1)');
    this._returnButton.setSelectedColor('rgba(255,255,255,0.8)','rgba(148,187,248,0.6)','rgba(75,195,255)');
    this._returnButton.setEnabled();
    this._returnButton.move(viewport.width - 150,10);
    this.addChild(this._returnButton);
};

Scene_Options.prototype.updateParallax = function(){
    var parallax = this._backSprite1._parallax;
    if (parallax) {
        parallax.tilePosition .x -= 0.418;
    }
};

Scene_Options.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._sceneId = 'Scene_Options';
    this._started = false;
};

Scene_Options.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    this.updateParallax();
};

Scene_Options.prototype.updateTouch = function(){
    if (TouchInput.isCancelled() && viewport.isInsideCanvas(TouchInput.x,TouchInput.y)) {
        this.cancelPage();
    }
};

Scene_Options.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    this.startFadeIn();
    this._started = true;
};

Scene_Options.prototype.update = function(){
    Scene_Base.prototype.update.call(this);
    this.updateTouch();
};

Scene_Options.prototype.cancelPage = function(){
    Scene_Base.prototype.terminate();
    SoundManager.playCancel();
    ConfigManager.save();
    this.startFadeOut();
    this.popScene();
};

Scene_Options.prototype.isStarted = function(){
    return this._started;
};

Scene_Options.prototype.backToTile = function(){

};
