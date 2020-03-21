
function Sprite_Blink() {
    this.initialize.apply(this, arguments);
}

Sprite_Blink.prototype = Object.create(Sprite_Sign.prototype);
Sprite_Blink.prototype.constructor = Sprite_Blink;

Sprite_Blink.prototype.initialize = function(filename) {
    Sprite_Sign.prototype.initialize.call(this,filename);
    this._blinkStop = 20;
    this._stayCount = 0;
    this._opacityStep = 10;
    this._minFade = 0;
    this._maxFade = 255;
    this._fadeSign = -1;
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
    this.updateBlinkStatus();
    this.updateBlink();
};
