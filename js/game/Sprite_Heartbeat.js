function Sprite_Heartbeat() {
    this.initialize.apply(this, arguments);
}

Sprite_Heartbeat.prototype = Object.create(Sprite.prototype);
Sprite_Heartbeat.prototype.constructor = Sprite_Heartbeat;

Sprite_Heartbeat.prototype.initialize = function(filename) {
    Sprite_Sign.prototype.initialize.call(this,filename);
    this._beatStop = 20;
    this._stayCount = 0;
    this._scaleStep = 0.15;
    this._minScale = 0.5;
    this._maxScale = 1.2;
    this._scaleSign = -1;
};


Sprite_Heartbeat.prototype.updateOpenness = function(){
    this.scale = this._openness/255;
};

Sprite_Heartbeat.prototype.updateScaleStatus = function(){
    if(!this.isOpen())
        return;
    if(this.scale >= this._maxScale && this._scaleSign !== -1){
        this._scaleSign = 0;
        this._stayCount++;
    }else if(this.scale <= this._minScale && this._scaleSign !==1){
        this._scaleSign = 0;
        this._stayCount++;
    }
    if(this.scale >= this._minScale && this._stayCount >= this._beatStop*1.2){
        this._stayCount = 0;
        this._scaleSign = -1;
    }else if(this.scale <= this._minScale && this._stayCount >= this._beatStop*0.85){
        this._stayCount = 0;
        this._scaleSign = 1;
    }
};

Sprite_Heartbeat.prototype.updateScale = function(){
    if(!this.isOpen())
        return;
    if(this._scaleSign <0 ){
        this.scale -= this._scaleStep;
    }
    else if (this._scaleSign >0)
        this.scale += this._scaleStep;
};

Sprite_Heartbeat.prototype.update = function() {
    Sprite_Sign.prototype.update.call(this);
    this.updateScaleStatus();
    this.updateScale();
};