function Sprite_Background() {
    this.initialize.apply(this, arguments);
}

Sprite_Background.prototype = Object.create(Sprite.prototype);
Sprite_Background.prototype.constructor = Sprite_Background;

Sprite_Background.prototype.initialize = function(bitmap) {
    Sprite.prototype.initialize.call(this,bitmap);
    this._tickCount = 0;
};

Sprite_Background.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateScale();
};

Sprite_Background.prototype.updateScale = function(){
    var wd = Graphics.width;
    var ht = Graphics.height;
    var h = wd / this.width;
    var v = ht / this.height;
    if (h >= 1 && h - 0.01 <= 1) h = 1;
    if (v >= 1 && v - 0.01 <= 1) v = 1;
    this.scale._x = this.scale._y = Math.max(h,v);
};