Game_Database.getRoom = function(n){
    if(!this._index['scene'] || ! this._index['scene'][n]){
        viewport.printError('there is no room data for index '+n);
    }else
        return this._index['scene'][n];
};

function Scene_Title() {
    this._status = 'start';
    this.initialize.apply(this, arguments);
};

Scene_Title.prototype = Object.create(Scene_Base.prototype);
Scene_Title.prototype.constructor = Scene_Title;

Scene_Title.prototype.isStarted = function(){
    return this._started;
};

Scene_Title.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    Game_Boot.updateBootProgress(20);
    setTimeout(this.autoStartScene.bind(this),200);
    viewport.endLoading();
    this._started = true;
};

Scene_Title.prototype.createRoom = function() {
    this._backSprite = new Sprite_Room(0);
    this.addChild(this._backSprite);
};

Scene_Title.prototype.createTitle = function(){
    this._titleSign = new Sprite_Sign('title');
    this.addChild(this._titleSign);
    this._titleSign.anchor.x = 0.5;
    this._titleSign.x = viewport.width/2;
    this._titleSign.y = viewport.height*0.18;
    this._titleCommand = new Window_Title('rgba(210,233,254,255)','rgba(65,127,185,255)',viewport.width/2-185, viewport.height*0.45,345, 328,false);
    this._titleCommand.setBackgroundDimmer('backgroundDimmer');
    this._titleCommand._fontSize = 38;
    this._titleCommand._lineHeight = 95;
    this._titleCommand._letterSpacing = 0;
    this._titleCommand._fontWidth = 32;
    this._titleCommand._openness = 0;
    this._titleCommand.addCommand('START','newGame');
    this._titleCommand.addCommand('OPTIONS','options');
    this.addChild(this._titleCommand);
    this._titleCommand.setHandler('newGame',  this.commandNewGame.bind(this));
    this._titleCommand.setHandler('options',  this.commandOptions.bind(this));
};

Scene_Title.prototype.createWindows = function(){
    this._talkWindow = new Window_Base();
};

Scene_Title.prototype.createOption = function(){
};

Scene_Title.prototype.reserveAllImages = function(){
};


Scene_Title.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    Game_Boot.updateBootProgress(30);
    this.createRoom();
    this.createTitle();
    this.createWindows();
    this.createOption();
    this.reserveAllImages();
};

Scene_Title.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._sceneId = 'Scene_Title';
    this._started = false;
};

Scene_Title.prototype.checkStartSceneClosed = function(){
    if(!this._titleCommand.isClosed() )
        return false;
    if(!this._titleSign.isClosed())
        return false;
    return this._backSprite.isClosed();
};

Scene_Title.prototype.checkUpgradeSceneClosed = function(){
    if(!this._talkWindow.isClosed())
        return false;
    return this._backSprite.isClosed();
};

Scene_Title.prototype.checkObserveSceneClosed = function(){
    if(!this._talkWindow.isClosed())
        return false;
    return this._backSprite.isClosed();
};

Scene_Title.prototype.fullyClosed = function(){
    let closed = true;
    if(this.status === 'start')
        return this.checkStartSceneClosed();
    else if(this.status === 'upgrade')
        return this.checkUpgradeSceneClosed();
    else if(this.status === 'observe')
        return this.checkObserveSceneClosed();
    else
        return this._fadeDuration === 0 && closed;
};

Scene_Title.prototype.updateStatus = function(){
    if(this._nextStatus && this.fullyClosed()){
            this._status = this._nextStatus;
            this._nextStatus = null;
            this.autoStartScene();
    }
};

Scene_Title.prototype.updateCursor = function(){
    if(!this.isBusy() && this._fadeSign === 0)
        this._sceneCouldMove = this._status === 'observe' || this._status === 'upgrade';

};

Scene_Title.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    this.updateStatus();
    this.updateCursor();
};

Scene_Title.prototype.autoStartTitle = function(){
    if(this._titleCommand)
        this._titleCommand.open();
    if(this._titleSign)
        this._titleSign.open();
};

Scene_Title.prototype.autoStartUpgrade = function(){
    this._backSprite.open();
};

Scene_Title.prototype.autoStartObserve = function(){
    this._backSprite.open();
};

Scene_Title.prototype.autoStartScene = function(){
     switch(this._status){
         case 'start':
             this.autoStartTitle();
             break;
         case 'upgrade':
             this.autoStartUpgrade();
             break;
         case 'observe':
             this.autoStartObserve();
             break;
     }
};

Scene_Title.prototype.changeStatus = function(status){
    this._nextStatus =   status;
};

Scene_Title.prototype.commandNewGame = function() {
    DataManager.setupNewGame();
    this._titleCommand.close();
    this._titleSign.close();
    this.changeStatus('observe');
};

Scene_Title.prototype.commandOptions = function() {
    this._titleCommand.close();
    SceneManager.push(Scene_Options);
};