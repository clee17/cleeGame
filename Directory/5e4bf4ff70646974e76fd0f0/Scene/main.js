function Scene_Main() {
    this._status = 'start';
    this.initialize.apply(this, arguments);
};

Scene_Main.prototype = Object.create(Scene_Base.prototype);
Scene_Main.prototype.constructor = Scene_Main;

Scene_Main.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._sceneId = 'Scene_Main';
    this._started = false;
};

Scene_Main.prototype.reserveImages = function(){
    ImageManager.reserveBitmap('item_small.png');
    ImageManager.reserveBitmap('item_large.png');
};

Scene_Main.prototype.createReturnButton = function(){
    this._returnButton  = new Sprite_Button(new Rectangle(0,0,150,60),'return');
    this._returnButton.setEvent(this.leaveGame.bind(this));
    this._returnButton.setFontSize(35);
    this._returnButton.setName("返回");
    this._returnButton.setNormalColor('rgba(255,255,255,0.8)','rgba(148,187,248,1)');
    this._returnButton.setSelectedColor('rgba(255,255,255,0.8)','rgba(148,187,248,0.6)','rgba(75,195,255)');
    this._returnButton.setEnabled();
    this._returnButton.move(viewport.width - 150,10);
    this.addChild(this._returnButton);
};

Scene_Main.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this._backSprite1 =  new Sprite('starrySky2.png');
    this.addChild(this._backSprite1);
    this._mainMap = new DisplayPort();
    this._talkWindow = new Window_Talk('talk1');
    this._talkWindow.setNameArea(60,2,viewport.width*0.8);
    this._talkWindow.setPosition(viewport.width/2,viewport.height-15);
    this._talkWindow.setNameOutline(0);
    this._talkWindow._refreshPauseSign('pauseSign.png');
    this._taskWindow = new Window_Task(186,165);
    this._itemWindow = new Window_Item(viewport.width - 186, 165);
    this._infoWindow = new Window_Info(viewport.width/2,229);
    this._alertWindow = new Window_Infoboard(viewport.width/2,60,'infoboard01.png');
    this._alertWindow.relocate(viewport.width/2,viewport.height*0.4);
    this._alertWindow.setTexture(ImageManager.loadBitmap('overTexture.png'));
    this.addChild(this._mainMap);
    this.addChild(this._infoWindow);
    this.addChild(this._taskWindow);
    this.addChild(this._itemWindow);
    this.addChild(this._talkWindow);
    this.addChild(this._alertWindow);
    this.createReturnButton();
    this.reserveImages();
};

Scene_Main.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    this._started = true;
    GameManager.initialize();
    this.startFadeIn();
};

Scene_Main.prototype.updateReturn = function(){
    if(this._returnButton._enabled && GameManager.getCurrentMap().index>0)
        this._returnButton.setDisabled();
    else if(!this._returnButton._enabled && GameManager.getCurrentMap().index === 0 && !this._mainMap.isBusy())
        this._returnButton.setEnabled();

};

Scene_Main.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    this.updateReturn();
    this._mainMap.updateInputEvent();
};

Scene_Main.prototype.isBusy = function(){
    let result = Scene_Base.prototype.isBusy.call(this);
    if(!this._alertWindow.isClosed())
        return true;
    if(!this._talkWindow.isClosed()){
        return true;
    }

    return result;
};

Scene_Main.prototype.closeAll = function(){
    this._infoWindow.close();
    this._taskWindow.close();
    this._itemWindow.close();
    TalkManager.terminate();
    this._talkWindow.deactivate();
    this._talkWindow.close();
    this._alertWindow.deactivate();
    this._alertWindow.close();
};

Scene_Main.prototype.leaveGame = function(){
    this.closeAll();
    this.startFadeOut();
    SceneManager.goto(Scene_Title);
};