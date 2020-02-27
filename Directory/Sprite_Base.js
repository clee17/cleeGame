console.log('Sprite_Base entered');

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

function ScreenSprite() {
    this.initialize.apply(this, arguments);
}

ScreenSprite.prototype = Object.create(PIXI.Container.prototype);
ScreenSprite.prototype.constructor = ScreenSprite;

ScreenSprite.prototype.initialize = function () {
    PIXI.Container.call(this);

    this._graphics = new PIXI.Graphics();
    this.addChild(this._graphics);
    this.opacity = 0;

    this._red = -1;
    this._green = -1;
    this._blue = -1;
    this._colorText = '';
    this.setBlack();
};

/**
 * The opacity of the sprite (0 to 255).
 *
 * @property opacity
 * @type Number
 */
Object.defineProperty(ScreenSprite.prototype, 'opacity', {
    get: function () {
        return this.alpha * 255;
    },
    set: function (value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

ScreenSprite.YEPWarned = false;
ScreenSprite.warnYep = function () {
    if (!ScreenSprite.YEPWarned) {
        console.log("Deprecation warning. Please update YEP_CoreEngine. ScreenSprite is not a sprite, it has graphics inside.");
        ScreenSprite.YEPWarned = true;
    }
};

Object.defineProperty(ScreenSprite.prototype, 'anchor', {
    get: function () {
        ScreenSprite.warnYep();
        this.scale.x = 1;
        this.scale.y = 1;
        return {x: 0, y: 0};
    },
    set: function (value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Object.defineProperty(ScreenSprite.prototype, 'blendMode', {
    get: function () {
        return this._graphics.blendMode;
    },
    set: function (value) {
        this._graphics.blendMode = value;
    },
    configurable: true
});

/**
 * Sets black to the color of the screen sprite.
 *
 * @method setBlack
 */
ScreenSprite.prototype.setBlack = function () {
    this.setColor(0, 0, 0);
};

/**
 * Sets white to the color of the screen sprite.
 *
 * @method setWhite
 */
ScreenSprite.prototype.setWhite = function () {
    this.setColor(255, 255, 255);
};

/**
 * Sets the color of the screen sprite by values.
 *
 * @method setColor
 * @param {Number} r The red value in the range (0, 255)
 * @param {Number} g The green value in the range (0, 255)
 * @param {Number} b The blue value in the range (0, 255)
 */
ScreenSprite.prototype.setColor = function (r, g, b) {
    if (this._red !== r || this._green !== g || this._blue !== b) {
        r = Math.round(r || 0).clamp(0, 255);
        g = Math.round(g || 0).clamp(0, 255);
        b = Math.round(b || 0).clamp(0, 255);
        this._red = r;
        this._green = g;
        this._blue = b;
        this._colorText = Utils.rgbToCssColor(r, g, b);

        var graphics = this._graphics;
        graphics.clear();
        var intColor = (r << 16) | (g << 8) | b;
        graphics.beginFill(intColor, 1);
        graphics.drawRect(-viewport.width * 5, -viewport.height * 5, viewport.width * 10, viewport.height * 10);
    }
};