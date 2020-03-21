
function Window_Task() {
    this.initialize.apply(this, arguments);
}

Window_Task.prototype = Object.create(Window_Base.prototype);
Window_Task.prototype.constructor = Window_Task;

Window_Task.prototype.initialize = function(x,y) {
    Window_Base.prototype.initialize.call(this,x-1,y,1,1,true);
    this.loadBackground('sideWindow');
    this._align = 'left';
    this._fontSize = 16;
    this._padding = 12;
    this._letterSpacing = 1;
    this._target = new Point(this.x,this.y);
    this._origin = new Point(this.x-1,this.y);
    this._marginDistance  = 25;
    this._openness = 0;
    this._blockTouch = true;
    this._maxStay = 150;
    this._initializeTaskLine();
};

Window_Task.prototype._initializeTaskLine = function(){
    this._mainTaskSign = new Sprite('taskBar01.png');
    this._mainTaskSign.anchor.x = 1;
    this._mainTaskSign.y = this._marginDistance*1.2;
    this._mainTaskSign2 = new Sprite('taskBar02.png');
    this._mainTaskSign2.y = this._marginDistance*1.2+80;
    this._mainTaskSign2.anchor.x = 1;
    this._windowBackSprite.addChild(this._mainTaskSign);
    this._windowBackSprite.addChild(this._mainTaskSign2);
};

Window_Task.prototype.loadBackground = function(filename){
    this._loadingBackBitmap = ImageManager.loadBitmap(filename+'.png');
    this._loadingBackBitmap .addLoadListener(this._onBackSpriteLoaded.bind(this));
};

Window_Task.prototype._onBackSpriteLoaded = function(){
    if(this._loadingBackBitmap){
        this._windowBackSprite.bitmap = this._loadingBackBitmap;
        this._width = this._windowBackSprite.width;
        this._height = this._windowBackSprite.height;
        this.x = -this._windowBackSprite.width + this._marginDistance;
        this._origin.x = this._target.x - this._windowBackSprite.width+this._marginDistance;
        this._mainTaskSign2.x = this._mainTaskSign.x = this._windowBackSprite.width - this._marginDistance*1.5;
        this.contents = new Bitmap(this._width,this._height,'none');
        this._refreshContents();
    }
};



Window_Task.prototype.drawMainTask = function(){
       let task = GameManager.getCurrentTask(0);
      if(task.length === 0){
          this.resetFontSettings();
          this.drawTextOneByOne('暂无任务',this.tx,this.ty);
      }else{
          for(let i =0; i<task.length;++i){
              this.resetFontSettings();
              this.drawTextOneByOne(task[i].name,this.tx,this.ty);
              this.ty+=this.lineHeight();
          }
      }
};

Window_Task.prototype.drawSideTask = function(){
    let task = GameManager.getCurrentTask(1);
    this._mainTaskSign2.visible = task.length !== 0;
    if(this._mainTaskSign2.visible){
        this.ty+=this.lineHeight();
        this._mainTaskSign2.move(0,this.ty);
        this.ty += this._mainTaskSign2.height;
        for(let i=0; i<task.length;++i){
            this.resetFontSettings();
            this.drawTextOneByOne(task[i].name,this.tx,this.ty);
            this.ty+=this.lineHeight();
        }
    }
};


Window_Task.prototype._refreshContents = function(){
    Window_Base.prototype._refreshContents.call(this);
    if(!this.contents)
        return;
    this.contents.clear();
    this.tx = 0;
    this.ty = this._marginDistance*2;
    this.drawMainTask();
    this.drawSideTask();
};

Window_Task.prototype.updateOpenness = function(){
    let moveDistance = this._windowBackSprite.width - this._marginDistance;
    this.x = this._origin.x -this._width + moveDistance* this._openness/255;
};

Sprite_Button.prototype.isInsideFrame = function(x,y){
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Window_Task.prototype.updateTouch = function(){
    this.children.forEach(function(child) {
        if (child.updateTouch) {
            child.updateTouch();
        }
    });
    if (TouchInput.isTriggered() && this.isWindowTouched()) {
        this._touching = true;
    }
    if(TouchInput.isReleased()){
        if(this._touching){
            this._touching = false;
            this.open();
            if(this._blockTouch)
                TouchInput._released = false;
        }
    }
};

Window_Task.prototype.updateOpen = function() {
    Window_Base.prototype.updateOpen.call(this);
    if(this.isOpen() && !this._opening && !this._staying){
        this._stayCount = 0;
        this._staying = true;
    }
};

Window_Task.prototype.updateStay = function(){
    if(this._staying)
        this._stayCount++;
    if(this._stayCount >= this._maxStay)
        this.close();
};

Window_Task.prototype.updateTask = function(){
    if(GameManager._taskUpdated)
        this._refreshContents();
};

Window_Task.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this.updateTouch();
    this.updateStay();
    this.updateTask();
};

Window_Task.prototype.close = function(){
    Window_Base.prototype.close.call(this);
    this._opening = false;
    this._staying = false;
    this._stayCount = 0;
};

Window_Task.prototype.open = function(){
    Window_Base.prototype.open.call(this);
    this._closing = false;
    this._staying = false;
    this._stayCount = 0;
};
