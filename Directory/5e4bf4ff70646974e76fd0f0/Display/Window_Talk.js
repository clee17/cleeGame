function Text_Cache(){
    this.initialize.apply(this, arguments);
}

Text_Cache.prototype.initialize = function() {
    this._text = null;
    this._loading = false;
    this._target = 0;
    this._current = 0;
};

Text_Cache.prototype.loaded = function(){
    return !!this._text;
};

Text_Cache.prototype.isLoading = function(){
    return this._loading;
};

Text_Cache.prototype.isEmpty = function(){
    return !this._loading && !this._text;
};

Text_Cache.prototype.processName = function(s){
    let nameInfo = Game_Database.getData('role',Number(s.substring(3,s.length-1)));
    let name = nameInfo.name;
    let nickName = nameInfo.nickname || '';
    if(nickName.indexOf(' ')>=0)
        nickName = nickName.split(' ');
    else
        nickName = [];
    if(name.indexOf(' ')>=0)
        name = name.split(' ');
    let nameType = Number(s[2]);
    if(nameType>=0 && nameType <2)
        name = name[nameType];
    else if (nameType ===2)
        name = nameInfo.name;
    else if (nameType >=3)
    {
        let index = nameType -3;
        name = nickName[index] || name[index];
    }

    return name;
};

Text_Cache.prototype.processText = function(index){
    let text = this._text[index].text;
    let tx = this;
    this._text[index].text = text.replace(/%[a-z][0-9]+%/g, function(s, n) {
        let result = '';
        if(s[1] === 'n' || s[1] === 'N')
            result = tx.processName(s);
        return result;
    });
};

Text_Cache.prototype.loadText = function(){
    this._text = GameManager.getCurrentText();
    for(let i=0; i<this._text.length;++i){
        if(typeof this._text[i].role === 'number'){
            this._text[i].role = Game_Database.getData('role',this._text[i].role);
            if(this._text[i].role.head)
                ImageManager.reserveBitmap(this._text[i].role.head);
        }
        this.processText(i);
    }
    this._target = this._text.length;
};

Text_Cache.prototype.getMessage  = function(){
    if(this._current < this._target)
    {
        return this._text[this._current++];
    }else{
        return null;
    }
};

Text_Cache.prototype.getText  = function(){
    if(!this._text || !this._text[this._current])
        return '';
    return this._text[this._current].text;
};

Text_Cache.prototype.type  = function(){
   if(this._text && this._text[this._current])
       return this._text[this._current].type;
   else return null;
};

Text_Cache.prototype.notEnd = function(){
    if(this._text && this._text[this._current])
        return this._text[this._current].type === "text";
    else return this._current < this._target;
};

Text_Cache.prototype.isEnd = function(){
    return this._current >= this._target;
};

TalkManager = function(){
    return 'this is a static class';
};

TalkManager._textCache = new Text_Cache();
TalkManager._messageCompleted = false;

TalkManager.loadText = function(){
    if(this._loadingText)
        return;
    this._loadingText = true;
    this._textCache.loadText();
    this._loadingText = false;
};

TalkManager.clearCache = function(){
    this._textCache = new Text_Cache();
};

TalkManager.notEnd = function(){
    return !this._textCache.isEmpty() && this._textCache.notEnd();
};

TalkManager.getMessage = function(){
    if(!this._textCache)
        return null;
    else{
        this._typing = true;
        this._messageCompleted = false;
        return this._textCache.getMessage();
    }
};

TalkManager.getInfoText = function(){
    if(!this._textCache)
        return null;
    else{
        this._typing = true;
        this._messageCompleted = false;
        return this._textCache.getText();
    }
};

TalkManager.textLoaded = function(){
    return !this._loadingText && this._textCache && this._textCache.loaded();
};

TalkManager.isLoading = function(){
    return this._textCache && this._textCache.isLoading();
};

TalkManager.isEmpty = function(){
    return this._textCache && this._textCache.isEmpty();
};

TalkManager.typing = function(){
    return this._messageCompleted || this._typing;
};

TalkManager.isCompleted = function(){
    return this._messageCompleted;
};

TalkManager.isText = function(){
    return this._textCache.type() === "text";
};

TalkManager.isInfo = function(){
    return this._textCache.type() === "info";
};

TalkManager.resetMessage = function(){
    this._messageCompleted = false;
    if(this._textCache.isEnd()){
        this.clearCache();
        GameManager.refreshEvent();
    }
};

TalkManager.completeMessage = function(){
    this._typing = false;
     this._messageCompleted = true;
};

TalkManager.update = function(){
    if(GameManager.isEventStarted() && GameManager.isTalkEvent() && this.isEmpty()){
        this.loadText();
    }
};

function Window_Talk() {
    this.initialize.apply(this, arguments);
}

Window_Talk.prototype = Object.create(Window_Base.prototype);
Window_Talk.prototype.constructor = Window_Talk;

Window_Talk.prototype.initialize = function(filename) {
    Window_Base.prototype.initialize.call(this,0,0,1,1,true);
    this._align = 'left';
    this._message = null;
    this._showing = false;
    this.loadBackground(filename);
    this._letterSpacing = 2;
    this._fontSize = 24;
    this.openness = 0;
    this._paused = false;
    this.position = new Point(this.x,this.y);
    this._headArea = new Rectangle(35,30,this._width,this._height);
    this._contentsArea = new Rectangle(200,30,100,200);
    this._stayCount = 0;
    this._nameOutline = {color:'rgba(0,0,0,0)',width:4};
    this._nameSprite = new Sprite();
    this._headSprite = new Sprite();
    this._headMask = new Sprite('headMask.png');
    this._headMask.scale.y = 0.9;
    this._headSprite.mask = this._headMask;
    this._headSprite.addChild(this._headMask);
    this.addChild(this._headSprite);
    this.addChild(this._nameSprite);

    this.resetTextSpeed();
    this._refresh();
};

Object.defineProperty(Window.prototype, 'nameContents', {
    get: function() {
        return this._nameSprite.bitmap;
    },
    set: function(value) {
        this._nameSprite.bitmap = value;
    },
    configurable: true
});

Window_Talk.prototype.nameSize = function(){
    return this._nameFontSize || 18;
};

Window_Talk.prototype.nameColor = function(){
    return this._nameColor || 'rgba(0,0,0,1)';
};

Window_Talk.prototype.setNameOutline = function(outline,color){
    if(outline === undefined)
        outline = this._nameOutline.width;
   this._nameOutline.width = outline;
   this._nameOutline.color =  color || this._nameOutline.color;
};

Window_Talk.prototype.createContents = function() {

};

Window_Talk.prototype._refreshContents = function() {
    this._windowContentsSprite.move(0, 0);
};

Window_Talk.prototype.resetTextSpeed = function(){
    this._textSpeed = ConfigManager.textSpeed();
};

Window_Talk.prototype.loadBackground = function(filename){
    this._loadingBackBitmap = ImageManager.loadBitmap(filename+'.png');
    this._loadingBackBitmap.addLoadListener(this._onBackSpriteLoaded.bind(this));
};

Window_Talk.prototype._onBackSpriteLoaded = function(){
     if(this._loadingBackBitmap){
         this._windowBackSprite.bitmap = this._loadingBackBitmap;
         this._width = this._windowBackSprite.width;
         this._height = this._windowBackSprite.height;
         this._contentsArea.width = this._width - this.standardPadding()*2 - this._fontSize;
         this._contentsArea.height = this._height - this.standardPadding()*2;
         this._nameSprite.bitmap = new Bitmap(this._width,this._fontSize,'none');
         this.contents = new Bitmap(this._width, this._height,'none');

         this.contents.x = this.standardPadding();
         this.contents.y = this.standardPadding();
         this._refresh();
     }
};

Window_Talk.prototype.setPosition = function(x,y){
    x = x || 0;
    y = y || 0;
    this.position.x = x;
    this.position.y = y;
};

Window_Talk.prototype.setNameArea = function(x,y,width,height){
    this._nameSprite.x = x || 0;
    this._nameSprite.y = y || 0;
    this._nameSprite.setFrame(0,0,width,height);
};


Window_Talk.prototype._refresh = function(){
    this.x = this.position.x - this._width/2;
    this.y = this.position.y - this._height;
    this._reposPauseSign();
};

Window_Talk.prototype.textOnDisplay = function(){
    return this._showing;
};

Window_Talk.prototype.drawName = function(){
    if(this._nameDirty){
        let fontSize = this.nameSize();
        this.nameContents.fontSize = fontSize;
        this.nameContents.outlineWidth = this._nameOutline.width;
        this.nameContents.outlineColor = this._nameOutline.color;
        this.nameContents.textColor = this.nameColor();
        this.nameContents.clear();
        let name = this._message.role.name;
        this.nameContents.drawText(name,0,0,this._width,fontSize,'left');
        this._nameDirty = false;
    }
};

Window_Talk.prototype.drawHead = function(){
    let head = this._message.role.head;
    if(head){
        this._headSprite.visible = true;
        this._headSprite.bitmap = ImageManager.loadBitmap(head);
        this._headSprite.scale.x = 0.55;
        this._headSprite.scale.y = 0.55;
    }else
        this._headSprite.bitmap = new Bitmap(this._headArea.width,this._headArea.height);
    this._headSprite.move(this._headArea.x,this._headArea.y);
};

Window_Talk.prototype.close = function(){

    Window_Base.prototype.close.call(this);
};

Window_Talk.prototype.newMessage = function(){
    this._message = TalkManager.getMessage();
    this._message.index = 0;
    this._message.tx = 0;
    this._message.ty  = 0;
    this.resetTextSpeed();
};

Window_Talk.prototype.addContentsLine = function(n){
    let sr = this.contents.rect;
    let tmpBitmap = new Bitmap(sr.width,sr.height,'none');
    sr.y = this._contentsArea.y + this.lineHeight()*n;
    sr.height = sr.height - this.lineHeight()*n - this._contentsArea.y;
    let tr = new Rectangle(0,this._contentsArea.y,sr.width,sr.height);
    tmpBitmap.blt(this.contents,sr.x,sr.y,sr.width,sr.height, tr.x,tr.y,tr.width,tr.height);
    this.contents = tmpBitmap;
    this._message.ty = this._message.ty - this.lineHeight()*n;
    this._message.ty = this._message.ty.clamp(0,this.contents.height);
};


Window_Talk.prototype.updateMessage = function(){
    if(TalkManager._messageCompleted)
        return;
    this.resetFontSettings();
    let index = this._message.index;
    let text = this._message.text[index];
    let tx = this._contentsArea.x +this._message.tx;
    let ty = this._contentsArea.y + this._message.ty;
    this.contents.drawText(text,tx,ty,this._fontSize,this.lineHeight(),'left');
    this._message.index++;
    this._message.tx += this._fontSize+this._letterSpacing*2;
    if(this._message.tx +this._contentsArea.x >= this._contentsArea.width){
        this._message.tx = 0;
        this._message.ty += this.lineHeight();
    }
    if(this._message.ty + this._contentsArea.y >= this._contentsArea.height){
        this.addContentsLine(1);
    }
    if(this._message.index >= this._message.text.length){
        TalkManager.completeMessage();
        this._paused = !this._message.option;
        if(this._message.ty+ this.lineHeight() + this._contentsArea.y >= this._contentsArea.height)
            this.addContentsLine(1);
    }
};

Window_Talk.prototype.resetMessage = function(){
    this.contents.clear();
    TalkManager.resetMessage();
    this._message = null;
    this._paused = false;
    this._showing = false;
};

Window_Talk.prototype.speedUpText = function(){
    this._textSpeed = 0;
};

Window_Talk.prototype.updateText = function(){
    if(TalkManager.textLoaded() && this.isClosed() && !TalkManager.typing() &&  TalkManager.isText()){
        this.open();
    }else if(!this.textOnDisplay() && this.isOpen() && TalkManager.notEnd()){
        this._showing = true;
        this._paused = false;
        this._nameDirty = true;
        this.newMessage();
        this.drawName();
        this.drawHead();
    }else if (this.textOnDisplay()){
        this._stayCount++;
        if(this._stayCount>= this._textSpeed && !this._paused){
            this._stayCount = 0;
            this.updateMessage();
        }
    }else if(!TalkManager.notEnd() && !this.textOnDisplay() && !this.isClosed() && !this._closing){
        this.close();
    }
};

Window_Talk.prototype.updateInput = function(){
    if (this._active && this.isOpen()) {
        if (TouchInput.isTriggered())
            this._touching = true;
        if (this._touching && TouchInput.isReleased())
            if(this._paused)
              this.resetMessage();
            else if(!this._paused && this.textOnDisplay())
               this.speedUpText();
    }
};

Window_Talk.prototype.updateContentsVisible = function(){
    this._nameSprite.visible = this.isOpen();
    this._headSprite.visible = this.isOpen();
};

Window_Talk.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this._active = this.isOpen();
    this.updateContentsVisible();
    this.updateText();
    this.updateInput();
};


function Window_Infoboard() {
    this.initialize.apply(this, arguments);
}

Window_Infoboard.prototype = Object.create(Window_Base.prototype);
Window_Infoboard.prototype.constructor = Window_Infoboard;

Object.defineProperty(Window.prototype, 'posX', {
    get: function() {
        return this._posX;
    },
    set: function(value) {
        this._posX = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'posY', {
    get: function() {
        return this._posY;
    },
    set: function(value) {
        this._posY = value;
        this._refreshAllParts();
    },
    configurable: true
});

Window_Infoboard.prototype.initialize = function(width,height,filename,margin) {
    let m = margin || 55;
    Window_Base.prototype.initialize.call(this,0,0,width+m*2,height+m*2,true);
    this._windowMargin = m;
    this._align = 'center';
    this._openStep = this._closeStep = 35;
    this._reserveBackBitmap = ImageManager.loadBitmap(filename);
    this._reserveBackBitmap.addLoadListener(this._refreshAllParts.bind(this));
    this._reserveCoverTexture = null;
    this._refreshAllParts();
    this.openness = 0;
};

Window_Infoboard.prototype.setTexture = function(bitmap){
    if(!bitmap)
        return;
    this._reserveCoverTexture = bitmap;
    this._reserveCoverTexture.addLoadListener(this._refreshAllParts.bind(this));
};

Window_Infoboard.prototype._refreshAllParts = function(){
    Window_Base.prototype._refreshAllParts.call(this);
    this._refreshCover();
    this._windowContentsSprite.move(35,25);

    this.x = this.posX - this.width/2;
    this.y  = this.posY - this.height/2;

};

Window_Infoboard.prototype._refreshBack = function() {
    if(!this._reserveBackBitmap)
        return;
    let bitmap = this._reserveBackBitmap;
    this._windowBackSprite.bitmap = new Bitmap(this.width,this.height,'none');
    let tbit = this._windowBackSprite.bitmap;
    let m = this._windowMargin;
    let w = this.width;
    let h = this.height;
    let sw = bitmap.width;
    let sh = bitmap.height;
    tbit.blt(bitmap,0,0,m,m, 0,0,m,m);
    tbit.blt(bitmap,sw-m,0,m,m,w-m,0,m,m);
    tbit.blt(bitmap,0,sh-m,m,m,0,h-m,m,m);
    tbit.blt(bitmap,sw-m,sh-m,m,m,w-m,h-m,m,m);
    tbit.blt(bitmap,m,m,sw-m*2,sh-m*2,m,m,w-m*2,h - m*2);
    tbit.blt(bitmap,m,0,sw-m*2,60,60,0,w-m*2,m);
    tbit.blt(bitmap,m,sh-m,sw-m*2,m,m,h-m,w-m*2,m);
    tbit.blt(bitmap,0,m,m,sh-m*2,0,m,m,h-m*2);
    tbit.blt(bitmap,sw-m,m,m,sh-m*2,w-m,m,m,h-m*2);
};

Window_Infoboard.prototype._refreshFrame = function() {
    if(!this._windowFrameContainer){
        this._windowFrameContainer = new PIXI.Container();
        this.addChild(this._windowFrameContainer);
    }
    if(!this._frameTop){
        this._frameTop = new Sprite('infoBoardTop.png');
        this.addChild(this._frameTop);
    }
    if(!this._frameBottom){
        this._frameBottom = new Sprite('infoBoardBottom.png');
        this.addChild(this._frameBottom);
    }
    this._frameTop.move(-18,-10);
    this._frameBottom.anchor.x = 1;
    this._frameBottom.anchor.y = 1;
    this._frameBottom.move(this.width+10,this.height+10);
};

Window_Infoboard.prototype._refreshCover = function(){
    if(!this._reserveCoverTexture || this._reserveCoverTexture.height < 50)
        return;
    if(!this._windowCoverSprite){
        this._windowCoverSprite = new Sprite(new Bitmap(this.width,this.height,'none'));
        this.addChildToBack(this._windowCoverSprite);
        this._windowCoverSprite.bitmap.clear();
        this._windowCoverSprite.opacity = 110;
    }
    let cover = this._reserveCoverTexture;
    this._windowCoverSprite.bitmap = new Bitmap(this.width,this.height,'none');
    let contents = this._windowCoverSprite.bitmap;
    contents.clear();
    let maxHeight = this.height;
    let ty = 0;
    while(ty < maxHeight){
        let height = cover.height;
        if(ty + height > maxHeight)
            height = maxHeight - ty;
        contents.blt(cover,0,0,cover.width,height,0,ty,contents.width,height);
        ty+= cover.height;
    }
};

Window_Infoboard.prototype.relocate = function(x,y){
    this.posX = x;
    this.posY = y;
};

Window_Infoboard.prototype.updateOpenness = function(){
    this.scale.y = this._openness/255;
};

Window_Infoboard.prototype.loadInfo = function(){
    if(TalkManager.isInfo())
        this._info = TalkManager.getMessage();
    else
        this._info = null;
    if(!this._info){
        this.close();
    }else{
        let text = this._info.text;
        this.drawAllText(text);
        this._paused = true;
    }
};

Window_Infoboard.prototype.resizeInfoBoard = function(text){
    let textHeight  = this.calcTextHeight(text);

    this.height = textHeight+this._windowMargin*2;
};

Window_Infoboard.prototype.updateText = function(){
    if(TalkManager.textLoaded() && this.isClosed() && !TalkManager.typing() && TalkManager.isInfo()){
        this.resizeInfoBoard(TalkManager.getInfoText());
        this.open();
    }else if(!this._paused && this.isOpen()){
        this.loadInfo();
    }
};

Window_Infoboard.prototype.updateInput = function(){
    if (this.isOpen()) {
        if (TouchInput.isTriggered())
            this._touching = true;
        if (this._touching && TouchInput.isReleased() && this._paused){
            TalkManager.completeMessage();
            TalkManager.resetMessage();
            this._paused = false;
            this.loadInfo();
        }
    }
};

Window_Infoboard.resize = function(width,height){
    this.width = width;
    this.height = height;
    this._refreshAllParts();
};

Window_Infoboard.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this._active = this.isOpen();
    this.updateText();
    this.updateInput();
};

Window_Infoboard.prototype.contentsWidth = function() {
    return this.width - this._padding * 2 - 50;
};

Window_Infoboard.prototype._refreshContents = function() {
    var m = this._padding;
    var w = this._width - m * 2;
    var h = this._height - m * 2;
    var bitmap = new Bitmap(w, h,'none');
    bitmap.clear();
    this._windowContentsSprite.bitmap = bitmap;
    this.contentsOpacity = 255;
};

Window_Infoboard.prototype._updateContents = function(){
    this._windowContentsSprite.move(this.padding*2, this.padding*2.5);
};