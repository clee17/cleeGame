function Scene_Options() {
    this.initialize.apply(this, arguments);
};

Scene_Options.prototype = Object.create(Scene_Base.prototype);
Scene_Options.prototype.constructor = Scene_Options;

Scene_Options.prototype.create = function() {
    Scene_Options.prototype.create.call(this);

};

Scene_Options.prototype.initialize = function() {
    Scene_Options.prototype.initialize.call(this);
    this._sceneId = 'Scene_Options';
    this._started = false;
};

Scene_Options.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    this.updateTitle();
    this.updateParallax();
};

Scene_Options.prototype.start = function() {
    Scene_Base.prototype.start.call(this);

    this._started = true;
};


Scene_Options.prototype.isStarted = function(){
    return this._started;
};
