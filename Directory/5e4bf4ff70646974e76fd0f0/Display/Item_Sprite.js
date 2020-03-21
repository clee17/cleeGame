function Item_Sprite() {
    this.initialize.apply(this, arguments);
}

Item_Sprite.prototype = Object.create(PIXI.Container.prototype);
Item_Sprite.prototype.constructor = Item_Sprite;

Item_Sprite.prototype.initialize = function(width,height) {
    PIXI.Container.call(this);
    this._number = 0;
    this._name = '';
    this._width = width || 75;
    this._height  = height|| 75;
    this._itemIndex = -1;
    this._createAllParts();
    this._refreshAllParts();
};

Item_Sprite.prototype._createAllParts = function(){
    this._backGround = new Sprite('itemBackground.png');
    this._backGround.move(5,0);
    this._iconSprite = new Sprite();
    this._iconSprite.move(5,0);
    this._contentsSprite = new Sprite(new Bitmap(85,100,'none'));
    this._contentsSprite.bitmap.clear();
    this.addChild(this._backGround);
    this.addChild(this._iconSprite);
    this.addChild(this._contentsSprite);
};

Object.defineProperty(Item_Sprite.prototype, 'contents', {
    get: function() {
        return this._contentsSprite.bitmap;
    },
    set: function(value) {
        this._contentsSprite.bitmap = value;
    },
    configurable: true
});



Item_Sprite.prototype._refreshAllParts = function(){
    this._refreshNum();
    this._refreshName();
};

Item_Sprite.prototype._refreshName = function(){
    this.contents.clearRect(0,80,100,20);
    this.contents.fontSize = 18;
    this.contents.drawText(this._name,0,80,90,20,'center');
};

Item_Sprite.prototype._refreshNum = function(){
    this.contents.clearRect(0,46,100,20);
    this.contents.fontSize = 16;
    this.contents.drawText(this._number.toString(),0,46,72,20,'right');
};

Item_Sprite.prototype.setNum = function(num){
    this._number=num;
    this._refreshNum();
};

Item_Sprite.prototype.setName = function(name){
    this._name = name;
    this._refreshName();
};

Item_Sprite.prototype.setImage = function(bitmap){
    this._iconSprite.bitmap = bitmap;
    this._iconSprite.setFrame(0,0,this._width,this._height);
};

Item_Sprite.prototype.setIcon = function(imgId){
    let x = imgId%5;
    let y = Math.floor(imgId/5);
    this._iconSprite.setFrame(x*this._width,y*this._height,this._width,this._height);
};

Item_Sprite.prototype.setItem = function(item){
    if(item.index !== undefined && item.num){
        this._itemIndex = item.index;
        let info = Game_Database.getData('item',this._itemIndex);
        this.setNum(item.num);
        this.setName(info.name);
        this.setIcon(info.imgId);
    }
};

Item_Sprite.prototype.move = function(x,y){
    this.x = x;
    this.y = y;
};