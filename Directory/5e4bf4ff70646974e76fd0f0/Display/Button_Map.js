function Button_Map() {
    this.initialize.apply(this, arguments);
}

Button_Map.prototype = Object.create(Sprite_Button.prototype);
Button_Map.prototype.constructor = Button_Map;

Button_Map.prototype.initialize = function(filename,symbol) {
    Sprite_Button.prototype.initialize.call(this,filename,symbol);
    this._createAllParts();
};

Button_Map.prototype._createAllParts = function(){
    this._disabledDeco = new Sprite('keepAway.png');
    this._disabledDeco.scale.y = 0.5;
    this._disabledDeco.scale.x = 0.5;
    this._disabledDeco.x = 25;
    this._disabledDeco.y = 8;
    this.addChild(this._disabledDeco);
    this._disabledDeco.visible = !this._enabled;
};

Button_Map.prototype._refreshStatus = function(){
    Sprite_Button.prototype._refreshStatus.call(this);
    if(this._disabledDeco)
       this._disabledDeco.visible = !this._enabled;
};

Button_Map.prototype.setEnabled = function(enabled){
    if(this._enabled !== enabled){
        this._enabled = enabled;
        this._refreshStatus();
    }
};

Button_Map.prototype.callClickHandler = function(){
    let index = Number(this._symbol);
    GameManager.changeMap(index);
};