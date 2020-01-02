/****************
 *  Scene
 *
 *
 ****************/

function Scene(){
    this.initialize.apply(this,aruguments);
}

Scene.prototype = Object.create(Layer.prototype);
Scene.prototype.constructor = Scene;

Scene.prototype.initialize = function(){
    Scene.prototype.call(this);
    this._active = false;
    this._animating = false;
    this._animationDuration = 0;
    this._mask = null;
    this._background = null;
    this._cascadeOpacityEnabled = false;
    this._cascadeColorEnabled = false;
    this.interactive = false;
};

Scene.prototype.create = function(){

};

Scene.prototype.isActive = function(){
    return this._active;
};

Scene.prototype.isReady = function(){
    return texture_manager.isReady();
};

Scene.prototype.start = function(){
    this._active = true;
};

Scene.prototype.update = function(){
    this.updateAnimation();
    this.updateChildren();
};

Scene.prototype.stop = function(){
    this._active = false;
};

Scene.prototype.isBusy = function(){
    return this._animationDuration > 0;
};

Scene.prototype.terminate = function(){

};

Scene.prototype.updateAnimation = function(){
    if(this._animationDuration>0)
    {
        var d = this._animationDuration;
        this.prototype.opacity = 0;
    }
};

Scene.prototype.updateChildren = function(){
    this.children.forEach(function(child){
        if(child.update)
        {
            child.update();
        }
    });
};


/*
*
*   Scene_Boot
*
 */

function Scene_Boot(){
    this.initialize.apply(this,arguments);
}

Scene_Boot.prototype = Object.create(Scene.prototype);
Scene_Boot.prototype.constructor = Scene_Boot;

Scene_Boot.prototype.initialize = function(){
  Scene.prototype.initialize.call(this);
  this._startData = Date.now();
};

Scene_Boot.prototype.create = function(){
  Scene.prototype.create.call(this);
  data_manager.loadDataBase();
  ConfigManager.load();
  this.loadLogo();
};

Scene_Boot.prototype.loadLogo = function(){
  ImageManager.reserveSystem('Window');
};

console.log('finished Scene_Boot definition');