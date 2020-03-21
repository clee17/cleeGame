
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
    this._scalSign = -1;
};


Sprite_Sign.prototype.updateOpenness = function(){
    this.scale = this._openness/255;
};

Sprite_Blink.prototype.updateBlinkStatus = function(){
    if(!this.isOpen())
        return;
    if(this.opacity >= this._maxFade && this._fadeSign !== -1){
        this._fadeSign = 0;
        this._stayCount++;
    }else if(this.opacity <= this._minFade && this._fadeSign !==1){
        this._fadeSign = 0;
        this._stayCount++;
    }
    if(this.opacity >= this._maxFade && this._stayCount >= this._blinkStop*1.2){
        this._stayCount = 0;
        this._fadeSign = -1;
    }else if(this.opacity <= this._minFade && this._stayCount >= this._blinkStop*0.85){
        this._stayCount = 0;
        this._fadeSign = 1;
    }
};

Sprite_Blink.prototype.updateBlink = function(){
    if(!this.isOpen())
        return;
    if(this._fadeSign <0 ){
        this.opacity -= this._opacityStep;
    }
    else if (this._fadeSign >0)
        this.opacity += this._opacityStep;
};

Sprite_Blink.prototype.update = function() {
    Sprite_Sign.prototype.update.call(this);
    this.updateScaleStatus();
    this.updateScale();
};