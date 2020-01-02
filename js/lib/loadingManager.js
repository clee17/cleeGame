//-----------------------------------------------------------------------------
// LoadingManager
//
// used to manager all loading projects


function loadingManager(){
    return 'this is a static class';
}

loadingManager._loadingProgress = 0;

loadingManager.initialize = function(){
    this._loadingProgress = 0;
    this._maxCount = 0;
    this._currentCount = 0;
};

loadingManager.updateProgress = function(step)
{
    this._loadingProgress += step;
    this._loadingProgress = Math.min(this._loadingProgress,100);
};

loadingManager.reset = function(){
    this._loadingProgress = 0;
    this._maxCount = 0;
    this._currentCount = 0;
};

loadingManager.fulfil = function(){
    this._loadingProgress = 100;
    this._currentCount = this._maxCount;
};

loadingManager.updateProgByFile = function(){
    if(this._maxCount>0)
        this._currentCount++;
    else
        this._maxCount = this._currentCount = 1;
    this._loadingProgress = parseInt(this._currentCount/this._maxCount*100);
};


loadingManager.setTarget = function(target){
    this._maxCount = target;
};


loadingManager.addTarget = function(step){
    this._maxCount+= step;
};
