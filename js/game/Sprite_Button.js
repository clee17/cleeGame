function Sprite_Button() {
    this.initialize.apply(this, arguments);
}

Sprite_Button.prototype = Object.create(Sprite.prototype);
Sprite_Button.prototype.constructor = Sprite_Button;

Sprite_Button.prototype.initialize = function(filename,symbol) {
    Sprite.prototype.initialize.call(this);
    this._enabled = true;
    this._selected = false;
    this._touching = false;
    this._handler = null;
    this._active = true;
    this._contentsSprite = new Sprite();
    this._nameArea = new Rectangle(0,0,this._width,this._height);
    this._symbol = symbol || filename;
    this._name = '';
    this._fontSize = 14;
    this._comment = '';
    if(typeof filename === 'string'){
        this._fullTexture  = ImageManager.loadBitmap(filename);
        this._fullTexture.addLoadListener(this._btnBitmapLoaded.bind(this));
    } else  if(typeof filename === 'object'){
        this._fullTexture = filename;
        this._btnBitmapLoaded();
    }
};

Sprite_Button.prototype.callClickHandler = function(){
    if(this._handler)
    {
        this._handler(this._symbol);
        this._active = false;
    }

};

Sprite_Button.prototype.getCurrentFrame = function(){
    let x = 0;
    let y = 0;
    let width = this._width;
    let height = this._height;
    if(this._enabled)
        y = 0;
    else
        y= height*2;
    if(this._selected)
        y = height;
    return new Rectangle(x,y,width,height);
};


Sprite_Button.prototype._btnBitmapLoaded = function(){
    this._width = this._fullTexture.width;
    this._height = this._fullTexture.height/3;
    this.bitmap = this._fullTexture;
    this._contentsSprite.bitmap =  new Bitmap(this._width,this._height,'none');
    this.addChild(this._contentsSprite);
    this._nameArea.width = this._width;
    this._nameArea.height = this._height;
    this._refreshStatus();
};

Sprite_Button.prototype.isInsideFrame = function(x,y){
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Sprite_Button.prototype.updateHover = function(){
    let x = this.canvasToLocalX(TouchInput._hoverX);
    let y = this.canvasToLocalY(TouchInput._hoverY);
    if(this._active && this._enabled)
    {
        if(this.isInsideFrame(x,y) && !this._selected){
            this._selected = true;
            this._refreshStatus();
        }else if(this._selected && !this.isInsideFrame(x,y)){
            this._selected = false;
            this._refreshStatus();
        }
    }
};

Sprite_Button.prototype.isButtonTouched =function(){
    let x = this.canvasToLocalX(TouchInput.x);
    let y = this.canvasToLocalY(TouchInput.y);
    return this.isInsideFrame(x,y);
};

Sprite_Button.prototype.updateTouch = function(){
    if (this._enabled && this._active) {
        if (TouchInput.isTriggered() && this.isButtonTouched()) {
            this._touching = true;
            if(!this._selected){
                this._selected = true;
                this._refreshStatus();
            }
        }
        if (this._touching) {
            if (TouchInput.isReleased()) {
                this._touching = false;
                if(this._selected){
                    this._selected = false;
                    this._refreshStatus();
                }
                if (TouchInput.isReleased()) {
                    this.callClickHandler();
                }
            }
        }
    } else {
        this._touching = false;
    }
};

Sprite_Button.prototype._refreshStatus = function(){
    let rect = this.getCurrentFrame();
    this.setFrame(rect.x,rect.y,this._width,this._height);
};

Sprite_Button.prototype.updateName = function(){
    if(this._nameDirty)
        this.refreshName();
};

Sprite_Button.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateHover();
    this.updateTouch();
    this.updateName();
};

Sprite_Button.prototype.getNameArea = function(){
    return this._nameArea;
};

Sprite_Button.prototype.refreshName = function(){
    let rect =  this.getNameArea();
    if(this._contentsSprite.bitmap)
    {
        this._nameDirty = false;
        this._contentsSprite.bitmap.clear();
        this._contentsSprite.bitmap.fontSize = this._fontSize;
        let tx = rect.x;
        for(let i = 0; i< this._name.length;++i){
            let spacing = 3;
            let text = this._name[i];
            let maxWidth = this._fontSize;
            if(text.match(/[a-zA-Z]/)){
                if(text.match(/[a-z]/))
                    maxWidth*=0.68;
                else if(text.match(/[A-Z]/))
                    maxWidth *= 1.2;
            }
            if(this._name[i+1] &&  this._name[i+1].match(/[a-zA-Z]/)){
                spacing = 0;
            }
            this._contentsSprite.bitmap.drawText(text,tx,rect.y,maxWidth,rect.height,'center');
            tx+= maxWidth+spacing*2;
        }

    }
};

Sprite_Button.prototype.setName = function(btnName){
    this._name = btnName || '';
    this._nameDirty = true;
    this.refreshName();
};

Sprite_Button.prototype.setNameArea =function(x,y,width,height){
    this._nameArea.x = x || 0;
    this._nameArea.y = y || 0;
    this._nameArea.width = width || this._width;
    this._nameArea.height = height || this._height;
    this.refreshName();
};

Sprite_Button.prototype.setComment =function(comment){
    this._comment = comment;
};

Sprite_Button.prototype.setFontSize = function(fontSize){
    this._fontSize = fontSize;
};
