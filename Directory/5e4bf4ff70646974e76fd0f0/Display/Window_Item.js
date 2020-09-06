function Window_Item() {
    this.initialize.apply(this, arguments);
}

Window_Item.prototype = Object.create(Window_Base.prototype);
Window_Item.prototype.constructor = Window_Item;

Window_Item.prototype.initialize = function(x,y) {
    Window_Base.prototype.initialize.call(this,x-1,y,1,1,true);
    this._align = 'left';
    this._target = new Point(this.x,this.y);
    this._origin = new Point(this.x+1,this.y);
    this._marginDistance  = 20;
    this._openness = 0;
    this._blockTouch = true;
    this._maxStay = 150;
    this._windowBackSprite.anchor.x = 1;
    this._item = [];
    this.loadBackground('sideWindow');
    this.createAllItem();
};

Window_Item.prototype.createAllItem = function(){
    for(let i=0; i<6;++i){
        this._item[i] = new Item_Sprite();
        this._item[i].setImage(ImageManager.loadBitmap('item_small.png'));
        this._item[i].move(this._marginDistance+ i%2*85,this._marginDistance+Math.floor(i/2)*120);
        this._item[i].alpha = 0;
        this.addChild(this._item[i]);
    }
    this.resetItem();
};

Window_Item.prototype.loadBackground = function(filename){
    this._loadingBackBitmap = ImageManager.loadBitmap(filename+'.png');
    this._loadingBackBitmap .addLoadListener(this._onBackSpriteLoaded.bind(this));
};

Window_Item.prototype._onBackSpriteLoaded = function(){
    if(this._loadingBackBitmap){
        this._windowBackSprite.bitmap = this._loadingBackBitmap;
        this._width = this._windowBackSprite.width;
        this._height = this._windowBackSprite.height;
        this._windowBackSprite.scale.x = -1;
        this._origin.x = this._target.x + this._windowBackSprite.width-this._marginDistance;
        this.x = this._origin.x;
    }
};

Window_Item.prototype.updateTouch = function(){
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


Window_Item.prototype.updateOpenness = function(){
    let moveDistance = this._origin.x - this._target.x;
    let distance = moveDistance*this._openness*2/255;
    distance = distance.clamp(0,this._origin.x-this._target.x);
    this.x = this._origin.x -  distance;
};

Window_Item.prototype.updateOpen = function() {
    Window_Base.prototype.updateOpen.call(this);
    if(this.isOpen() && !this._opening && !this._staying){
        this._stayCount = 0;
        this._staying = true;
    }
};

Window_Item.prototype.updateStay = function(){
    if(this._staying)
        this._stayCount++;
    if(this._stayCount >= this._maxStay)
        this.close();
};

Window_Item.prototype.resetItem = function(){
    let backPack = GameManager.getValue('backpack');
    for(let i=0; i<6;++i){
        if(backPack[i]){
            this._item[i].alpha = 1;
            this._item[i].setItem(backPack[i]);
        }else this._item[i].alpha = 0;
    }
};

Window_Item.prototype.updateItem = function(){
    if(GameManager._backpackUpdated){
        this.resetItem();
    }
};

Window_Item.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this.updateTouch();
    this.updateStay();
    this.updateItem();
};

Window_Item.prototype.close = function(){
    Window_Base.prototype.close.call(this);
    this._opening = false;
    this._staying = false;
    this._stayCount = 0;
};

Window_Item.prototype.open = function(){
    Window_Base.prototype.open.call(this);
    this._closing = false;
    this._staying = false;
    this._stayCount = 0;
};
