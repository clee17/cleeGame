function Window_Info() {
    this.initialize.apply(this, arguments);
}

Window_Info.prototype = Object.create(Window_Base.prototype);
Window_Info.prototype.constructor = Window_Info;

Window_Info.prototype.initialize = function(x,y) {
    Window_Base.prototype.initialize.call(this,x,y,607,229,true);
    this._target = new Point(this.x,this.y);
    this._origin = new Point(this.x,this.y-1);
    this._marginDistance  = 25;
    this._fontSize = 18;
    this._openness = 0;
    this._staying = false;
    this._maxStay = 150;
    this.loadBackground('topboard');
};

Window_Info.prototype.loadBackground = function(filename){
    this._loadingBackBitmap = ImageManager.loadBitmap(filename+'.png');
    this._loadingBackBitmap .addLoadListener(this._onBackSpriteLoaded.bind(this));
};


Window_Info.prototype._onBackSpriteLoaded = function(){
    if(this._loadingBackBitmap){
        this._windowBackSprite.bitmap = this._loadingBackBitmap;
        this.x = this._target.x - this._windowBackSprite.width/2;
        this._target.y = 0;
        this._origin.y = this._target.y - (this._windowBackSprite.height-this._marginDistance*2.5);
        this.updateOpenness();
    }
};

Window_Info.prototype._createAllParts = function(){
    Window_Base.prototype._createAllParts.call(this);
    this._windowButtonContainer = new PIXI.Container();
    this.addChild(this._windowButtonContainer);
    this._expandButton = new Sprite_Button('topbutton','expandTop');
    this._expandButton.move(280,185);
    this._expandButton.setEvent(this.open.bind(this));
    this._windowButtonContainer.addChild(this._expandButton);
    this._hp = new Progress_Pie('progress_top1');
    this._hp.move(150,25);
    this._step = new Progress_Pie('progress_top2');
    this._step.move(397,25);
    this.addChild(this._hp);
    this.addChild(this._step);
    this._markLeft = new Sprite('topMark');
    this._markRight = new Sprite('topMark');
    this._markLeft.move(48,7);
    this._markRight.move(550,7);
    this._markRight.scale.x = -1;
    this.addChild(this._markLeft);
    this.addChild(this._markRight);
    this._fixedWindowSprite = new Sprite(new Bitmap(607,229,'none'));
    this._fixedWindowSprite.move(0,0);
    this.addChild(this._fixedWindowSprite);
    this._refreshInfomation();
};


Object.defineProperty(Window.prototype, 'topContents', {
    get: function() {
        return this._fixedWindowSprite.bitmap;
    },
    set: function(value) {
        this._fixedWindowSprite.bitmap = value;
    },
    configurable: true
});

Window_Info.prototype.createContents = function(){
    Window_Base.prototype.createContents.call(this);
};

Window_Info.prototype.drawMapInfo = function(){
    let mapInfo = GameManager.getCurrentMap();
    this.contents.clearRect(230,0,150,this._height);
    this.resetFontSettings();
    let text = "位置 : "+mapInfo.name;
    this.contents.drawText(text,0,8,this._width - this._marginDistance*1.5,this.lineHeight(),'center');
};

Window_Info.prototype.drawPlayerInfo = function(){
    let userInfo = GameManager.getUser();
    this.contents.clearRect(0,60,230,this._height);
    this.contents.clearRect(380,60,230,this._height);
    this.resetFontSettings();
    let hpInfo = GameManager.getHp();
    let stepInfo = GameManager.getStep();
    this.contents.drawText(hpInfo.hp+'/'+hpInfo.max,125,60,this._width,this.lineHeight(),'left');
    this.contents.drawText(stepInfo.step+'/'+stepInfo.max,385,60,this._width,this.lineHeight(),'left');
    this._hp.setProgress(hpInfo.hp/hpInfo.max);
    this._step.setProgress(stepInfo.step/stepInfo.max);
};


Window_Info.prototype.updateInfo = function(){
    if(GameManager._playerUpdated)
        this.drawPlayerInfo();
    if(GameManager._mapUpdated)
        this.drawMapInfo();


};

Window_Info.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this.updateButtons();
    this.updateStay();
    this.updateInfo();
};

Window_Info.prototype.reDrawPanel = function(){
    let fontSize = this._fontSize || 18;
    this.topContents.clear();
    this.topContents.fontSize = fontSize;
    this.topContents.drawText(TextManager.getNameForValue('hp'),62,18,607,fontSize,'left');
    this.topContents.drawText(TextManager.getNameForValue('step'),500,18,607,fontSize,'left');
};

Window_Info.prototype._refreshInfomation = function(){
    let fontSize = this._fontSize || 18;
    this.topContents.clear();
    this.topContents.fontSize = fontSize;
    this.topContents.drawText(TextManager.getNameForValue('hp'),62,18,607,fontSize,'left');
    this.topContents.drawText(TextManager.getNameForValue('step'),500,18,607,fontSize,'left');
};

Window_Info.prototype.updateButtons = function(){
    this._windowButtonContainer.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};


Window_Info.prototype.updateOpenness = function(){
    let moveDistance = this._target.y - this._origin.y;
    this.y = this._origin.y +  moveDistance* this._openness/255;
};


Window_Info.prototype.updateStay = function(){
    if(this._staying)
        this._stayCount++;
    if(this._stayCount >= this._maxStay)
        this.close();
};


Window_Info.prototype.updateOpen = function() {
    Window_Base.prototype.updateOpen.call(this);
    if(this.isOpen() && !this._opening && !this._staying){
        this._stayCount = 0;
        this._staying = true;
    }
};

Window_Info.prototype.close = function(){
    Window_Base.prototype.close.call(this);
    this._staying = false;
    this._stayCount = 0;
};

Window_Info.prototype.open = function(){
    Window_Base.prototype.open.call(this);
    this._closing = false;
    this._staying = false;
    this._stayCount = 0;
};
