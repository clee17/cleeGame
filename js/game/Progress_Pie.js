function Progress_Pie() {
    this.initialize.apply(this, arguments);
}

Progress_Pie.prototype = Object.create(Sprite.prototype);
Progress_Pie.prototype.constructor = Progress_Pie;

Progress_Pie.prototype.initialize = function(frontEnd) {
    let backEnd = frontEnd.split('_');
    Sprite.prototype.initialize.call(this,backEnd[0]);
    this._frontSprite = new Sprite(frontEnd);
    this.addChild(this._frontSprite);

};

Progress_Pie.prototype.setProgress = function(progress){
    this._frontSprite.mask = null;
    this._frontSprite.removeChildren();
    this._progressMask = new Sprite(new Bitmap(this.width,this.height,'none'));
    let contents = this._progressMask.bitmap;
    contents.clear();
    let context = contents._context;
    let radius = this.width/2+3;
    let core = {x:this.width/2,y:this.height/2};
    let startAngle = 0;
    let endAngle = (360*progress) * Math.PI/180;
    context.save();
    context.fillStyle = 'rgba(255,255,255,1)';
    context.beginPath();
    context.moveTo(core.x,core.y);
    context.arc(core.x,core.y,radius,startAngle,endAngle);
    context.fill();
    context.restore();
    contents._setDirty();
    this._frontSprite.mask = this._progressMask;
    this._frontSprite.addChild(this._progressMask);
};