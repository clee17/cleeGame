function Sprite_Player() {
    this.initialize.apply(this, arguments);
}

Sprite_Player.prototype = Object.create(Sprite.prototype);
Sprite_Player.prototype.constructor = Sprite_Player;

Sprite_Player.prototype.initialize = function(name) {
    Sprite.prototype.initialize.call(this,ImageManager.loadBitmap('player.png'));
    this._status = 0;
    this._faceId = 0;
    this._stayCount = 0;
    this._maxCount = 20;
    this.anchor.x = 0.45;
    this.anchor.y = 0.6;
    this._refreshFace();
};

Sprite_Player.prototype._refreshFace = function(){
    this.setFrame(0,77*this._faceId,70,77);
};

Sprite_Player.prototype.shock = function(){
    this._status = 1;
    this._faceId = 2;
    this._stayCount = 0;
    this._refreshFace();
};

Sprite_Player.prototype.normal = function(){
    this._status = 0;
    this._faceId = 0;
    this._stayCount = 0;
    this._refreshFace();
};

Sprite_Player.prototype.angry = function(){
    this._status = 2;
    this._faceId = 3;
    this._stayCount = 0;
    this._refreshFace();
};

Sprite_Player.prototype.updateFace = function(){
    if(this._faceId > 0)
        this._faceId = 0;
    else if(this._status === 0 && this._faceId === 0)
        this._faceId =1;
    this._refreshFace();
};

Sprite_Player.prototype.checkAnimationFrame = function(){
    if(this._faceId >1 && this._stayCount >= this._maxCount*2)
        return true;
    if(this._faceId === 0 && this._stayCount >= this._maxCount*7)
        return true;
    if(this._faceId === 1 && this._stayCount >= this._maxCount)
        return true;
    return false;
}

Sprite_Player.prototype.updateAnimation = function(){
      this._stayCount++;
      if(this.checkAnimationFrame()){
          this._stayCount = 0;
          this.updateFace();
      }
};

Sprite_Player.prototype.update = function(){
    Sprite.prototype.update.call(this);
    this.updateAnimation();
};