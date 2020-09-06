Window_Title.prototype.changeTextSelected = function(selected){
    if(this.contents && selected){
        this.contents._showShadow = true;
        this.contents.shadowColor = 'rgba(217,173,68,1)';
        this.contents.shadowBlur = 15;
    }else if(this.contents){
        this.contents._showShadow = false;
        this.contents.shadowBlur = 0;
    }
};

function Scene_Title() {
    this.initialize.apply(this, arguments);
};

Scene_Title.prototype = Object.create(Scene_Base.prototype);
Scene_Title.prototype.constructor = Scene_Title;

Scene_Title.prototype.createForeground = function() {
    this._backSprite2 = new Sprite('frontBoard.png');
    this._backSprite2.anchor.x = 1;
    this._backSprite2.anchor.y = 1;
    this._backSprite2.x = viewport.width;
    this._backSprite2.y = viewport.height;
    this.addChild(this._backSprite2);
    this._titleSprite = new Sprite('title.png');
    var titleSprite=  this._titleSprite;
    titleSprite.scale.x = 0.6;
    titleSprite.scale.y = 0.6;
    titleSprite.anchor.x = 0.5;
    titleSprite.anchor.y = 0.5;
    titleSprite.x = viewport.width/2-20;
    titleSprite.y = viewport.height*0.2;
    this._titleSprite.opacity = 0;
    this.addChild(this._titleSprite);
};


Scene_Title.prototype.createBackground = function() {
    this._backSprite1 =  new Sprite('starrySky.png');
    this._backSprite1._parallax = new TilingSprite('building.png',viewport.width,250);
    let parallax = this._backSprite1._parallax;
    parallax.anchor.x = 0;
    parallax.anchor.y = 1;
    parallax.x = 0;
    parallax.y = viewport.height;
    parallax.tilePosition.x = 150;
    this._backSprite1._character = new Sprite('character.png');
    let character = this._backSprite1._character;

    character.anchor.x = 0;
    character.anchor.y = 1;
    character.x= 0;
    character.y = viewport.height;

    this._backSprite1.addChild(parallax);
    this._backSprite1.addChild(character);
    this.addChild(this._backSprite1);
};

Scene_Title.prototype.createWindow = function(){
    this._titleCommand = new Window_Title('rgba(247,244,221,255)','rgba(221,188,109,255)',viewport.width/2-185, viewport.height*0.35,345, 328,false);
    this._titleCommand._fontSize = 35;
    this._titleCommand._lineHeight = 75;
    this._titleCommand._letterSpacing = 4;
    this._titleCommand._fontWidth = 35;
    this._titleCommand._openness = 0;
    this._titleCommand.addCommand(TextManager.newGame(),'newGame');
    this._titleCommand.addCommand(TextManager.rewards(), 'rewards',StorageManager.localSaveExisted());
    this._titleCommand.addCommand(TextManager.options(),'options');
    this._titleCommand.setHandler('newGame',  this.commandNewGame.bind(this));
    this._titleCommand.setHandler('rewards', this.commandRewards.bind(this));
    this._titleCommand.setHandler('options',  this.commandOptions.bind(this));
    this.addChild(this._titleCommand);
};

Scene_Title.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createForeground();
    this.createWindow();

    this.playTitleMusic();
};

Scene_Title.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._sceneId = 'Scene_Title';
    this._started = false;
};

Scene_Title.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    this.updateTitle();
    this.updateParallax();
};


Scene_Title.prototype.updateParallax = function(){
    var parallax = this._backSprite1._parallax;
    if (parallax) {
        parallax.tilePosition .x -= 0.418;
    }
};

Scene_Title.prototype.updateTitle = function(){
    if(!this._titleSprite || this._titleSprite.opacity >= 255)
        return;
    if(this._titleSprite && this._titleSprite._fadeDuration)
    {
        let timeLeft= this._titleSprite._fadeDuration;
        if(this._titleSprite.opacity <= 255*0.3)
            timeLeft*0.8;
        let step = (255-this._titleSprite.opacity)/this._titleSprite._fadeDuration;
        this._titleSprite.opacity += step;
        this._titleSprite._fadeDuration--;
    }
};

Scene_Title.prototype.playTitleMusic = function() {
};

Scene_Title.prototype.startAnimation = function(){
    if(this._titleSprite)
        this._titleSprite._fadeDuration = 60.0;
    this._started = true;
};

Scene_Title.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    viewport.endLoading();
    this.startAnimation();
    this._titleCommand.open();
    this._started = true;
};


Scene_Title.prototype.isStarted = function(){
    return this._started;
};

Scene_Title.prototype.commandNewGame = function() {
    // viewport.startNewGame();
    // return;
    if(GameManager._second === undefined)
        GameManager._second = false;
    else if (GameManager._second === false)
        GameManager._second = true;
    GameManager.startGame();
    this._titleCommand.close();
    this.fadeOutAll();
    SceneManager.goto(Scene_Main);
};

Scene_Title.prototype.commandRewards = function() {
    this._titleCommand.close();
    SceneManager.push(Scene_Rewards);
};


Scene_Title.prototype.commandOptions = function() {
    this._titleCommand.close();
    this.startFadeOut();
    SceneManager.push(Scene_Options);
};
