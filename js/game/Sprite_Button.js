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
    this._status = -1;
    this._contentsSprite = new Sprite();
    this.addChild(this._contentsSprite);
    this._nameArea = new Rectangle(15,0,this._width,this._height);
    this._blockTouch = true;
    this._symbol = symbol || filename;
    this._name = '';
    this._fontSize = 14;
    this._comment = '';
    this.initializeColors();
    this.initializeFullTexture(filename);
};

Sprite_Button.prototype.initializeFullTexture = function(filename){
    if(typeof filename === 'string'){
        this._fullTexture  = ImageManager.loadBitmap(filename);
        this._fullTexture.addLoadListener(this._btnBitmapLoaded.bind(this));
    }else if(filename.constructor === Rectangle){
        this._width = filename.width;
        this._height = filename.height;
        this.bitmap = new Bitmap(this._width,this._height,'none');
        this.bitmap.clear();
        this._reloadContents();
        this._refreshStatus();
    } else  if(typeof filename === 'object'){
        this._fullTexture = filename;
        this._btnBitmapLoaded();
    }
};

Sprite_Button.prototype.initializeColors = function(){
    this._disabledColor = 'rgba(138,138,138,1)';
    this._disabledOutline = 'rgba(0,0,0,0.8)';
    this._normalOutline = 'rgba(0,0,0,0.8)';
    this._normalColor = 'rgba(255,255,255,1)';
    this._selectedColor = 'rgba(255,255,255,1)';
    this._selectedOutline = 'rgba(0,0,0,0.8)';
    this._selectedShadow =  'rgba(255,255,255,0.8)';
    this._showShadow = false;
};


Sprite_Button.prototype.callClickHandler = function(){
    if(this._handler)
        this._handler(this._symbol);
};

Sprite_Button.prototype._btnBitmapLoaded = function(){
    this._width = this._fullTexture.width;
    this._height = this._fullTexture.height/3;
    this.bitmap = this._fullTexture;
    this._reloadContents();
    this._refreshStatus();
};

Sprite_Button.prototype._reloadContents = function(){
    this._contentsSprite.bitmap =  new Bitmap(this._width,this._height,'none');
    this._nameArea.width = this._width;
    this._nameArea.height = this._height;
};

Sprite_Button.prototype.isInsideFrame = function(x,y){
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Sprite_Button.prototype.updateHover = function(){
    let x = this.canvasToLocalX(TouchInput._hoverX);
    let y = this.canvasToLocalY(TouchInput._hoverY);
    if(this._enabled && this._active)
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
                this.callClickHandler();
                if(this._blockTouch)
                    TouchInput._released = false;
            }
        }
    } else {
        this._touching = false;
    }
};

Sprite_Button.prototype._refreshStatus = function(){
    if(!this._enabled)
       this._status = 2;
    else if(this._selected)
        this._status = 1;
    else
        this._status = 0;
    let width = this._width;
    let height = this._height;
    let rect = new Rectangle(0,height*this._status,width,height);
    if(this._fullTexture)
        this.setFrame(rect.x,rect.y,this._width,this._height);
    this.refreshName();
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

Sprite_Button.prototype.setDisabled = function(color,outline){
   this._disabledColor = color || 'rgba(255,255,255,1)';
   this._disabledOutline = outline || 'rgba(0,0,0,1)';
};

Sprite_Button.prototype.setNormalColor = function(color,outline){
    this._normalOutline = outline || 'rgba(0,0,0,0.8)';
    this._normalColor = color || 'rgba(255,255,255,1)';
    this.refreshName();
};

Sprite_Button.prototype.setSelectedColor = function(color,outline,shadow){
    this._selectedColor = color || 'rgba(255,255,255,1)';
    this._selectedOutline = outline || 'rgba(0,0,0,0.8)';
    this._selectedShadow = shadow || 'rgba(255,255,255,0.6)';
    this._showShadow = shadow !== undefined;
};

Sprite_Button.prototype.resetNormalFontSettings = function(){
    if(!this._contentsSprite.bitmap)
        return;
    this._contentsSprite.bitmap.textColor =this._normalColor;
    this._contentsSprite.bitmap.outlineColor = this._normalOutline;
    this._contentsSprite.bitmap._showShadow = false;
};

Sprite_Button.prototype.resetSelectedFontSettings = function(){
    if(!this._contentsSprite.bitmap)
        return;
    this._contentsSprite.bitmap.textColor = this._selectedColor;
    this._contentsSprite.bitmap.outlineColor = this._selectedOutline;
    this._contentsSprite.bitmap._showShadow = this._showShadow;
    if(this._showShadow){
        this._contentsSprite.bitmap.shadowColor = this._selectedShadow;
        this._contentsSprite.bitmap.shadowBlur = 15;
    }

};

Sprite_Button.prototype.resetDisabledFontSettings = function(){
    if(!this._contentsSprite.bitmap)
        return;
    this._contentsSprite.bitmap.textColor = this._disabledColor;
    this._contentsSprite.bitmap.outlineColor = this._disabledOutline;
    this._contentsSprite.bitmap._showShadow = false;
};


Sprite_Button.prototype.resetFontSettings = function(){
    if(this._status <0 || this._status >= 2)
        this.resetDisabledFontSettings();
    else if(this._status === 1)
        this.resetSelectedFontSettings();
    else
        this.resetNormalFontSettings();
};

Sprite_Button.prototype.refreshName = function(){
    if(this._contentsSprite.bitmap)
    {
        this._nameDirty = false;
        let rect =  this.getNameArea();
        this._contentsSprite.bitmap.clear();
        this._contentsSprite.bitmap.fontSize = this._fontSize;
        let tx = rect.x;
        this.resetFontSettings();
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

Sprite_Button.prototype.setEvent = function(callback){
    this._handler = callback || null;
};


Sprite_Button.prototype.setEnabled = function(){
    this._enabled = true;
    this._refreshStatus();
};


Sprite_Button.prototype.setDisabled = function(){
    this._enabled = false;
    this._refreshStatus();
};
