function Sprite_Room() {
    this.initialize.apply(this, arguments);
}

Sprite_Room.prototype = Object.create(Sprite.prototype);
Sprite_Room.prototype.constructor = Sprite_Blink;

Sprite_Room.prototype.initialize = function(index) {
    this._roomIndex = index || 0;
    this._filename = this.makeRoomFileName();
    Sprite.prototype.initialize.call(this,this._filename);
    this._upgradeShots = [];
    this._active = false;
    this._data = null;
    this.x =-480;
    this.preload();
    this.loadUpgradeShots();
};

Sprite_Room.prototype.preload = function(){
    ImageManager.reserveBitmap('upgradeShot');
    this._data = Game_Database.getRoom(this._roomIndex);
};


Sprite_Room.prototype.loadUpgradeShots = function(){

};

Sprite_Room.prototype.initializeTouchEvents = function(){
    TouchInput.registerTriggerEvent('room_click',this.onClick.bind(this));
    TouchInput.registerMoveEvent('room_move',this.onMove.bind(this));
    TouchInput.registerReleaseEvent('room_release',this.onUp.bind(this));
};

Sprite_Room.prototype.cancelTouchEvents = function(){
    TouchInput.removeTriggerEvent('room_click');
    TouchInput.removeMoveEvent('room_move');
    TouchInput.removeReleaseEvent('room_release');
};

Sprite_Room.prototype.onClick = function(x,y){
    if(!this._active)
        return;
    this._dragged = true;
    this._savedClick = {x:x,y:y};
};

Sprite_Room.prototype.onMove = function(x,y){
    if(!this._active)
        return;
    if(this._dragged)
    {
        let offsetX = x - this._savedClick.x;
        if(this.x + offsetX <= 0 && this.x +offsetX >= viewport.width- this.width)
        {
            this.x += offsetX;
            this._savedClick.x = x;
        }
    }
};

Sprite_Room.prototype.onUp = function(x,y){
    if(!this._active)
        return;
    this._dragged = false;
    this._originPosition = null;
};

Sprite_Room.prototype.update = function(){
    Sprite.prototype.update.call(this);
};

Sprite_Room.prototype.makeRoomFileName = function(){
    return 'scene%1'.format((this._index || 0).padZero(3));
};

Sprite_Room.prototype.open = function(){
    this.initializeTouchEvents();
    this._active = true;
};

Sprite_Room.prototype.close = function(){
    this.cancelTouchEvents();
    this._active = true;
};

Sprite_Room.prototype.isClosed = function(){
    return !this._active;
};
