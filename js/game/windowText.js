function Window() {
    this.initialize.apply(this, arguments);
}

Window.prototype = Object.create(PIXI.Container.prototype);
Window.prototype.constructor = Window;

Window.prototype.initialize = function(showBack,showPause) {
    PIXI.Container.call(this);

    this._showPause = showPause;
    this._isWindow = true;
    this._paused = false;
    this._width = 0;
    this._height = 0;
    this._cursorRect = new Rectangle();
    this._openness = 255;
    this._animationCount = 0;

    this._padding = 18;
    this._openStep = 12;
    this._closeStep = 12;
    this._margin = 4;
    this._colorTone = [0, 0, 0];

    this._windowSpriteContainer = null;
    this._windowBackSprite = null;
    this._windowCursorSprite = null;
    this._windowFrameSprite = null;
    this._windowContentsSprite = null;
    this._windowPauseSignSprite = null;

    this._createAllParts();

    this.origin = new Point();

    this.active = true;

    this.pause = false;
};

Object.defineProperty(Window.prototype, 'windowskin', {
    get: function() {
        return this._windowskin;
    },
    set: function(value) {
        if (this._windowskin !== value) {
            this._windowskin = value;
            this._windowskin.addLoadListener(this._onWindowskinLoad.bind(this));
        }
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'contents', {
    get: function() {
        return this._windowContentsSprite.bitmap;
    },
    set: function(value) {
        this._windowContentsSprite.bitmap = value;
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'width', {
    get: function() {
        return this._width;
    },
    set: function(value) {
        this._width = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'height', {
    get: function() {
        return this._height;
    },
    set: function(value) {
        this._height = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'padding', {
    get: function() {
        return this._padding;
    },
    set: function(value) {
        this._padding = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'margin', {
    get: function() {
        return this._margin;
    },
    set: function(value) {
        this._margin = value;
        this._refreshAllParts();
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'opacity', {
    get: function() {
        return this.alpha * 255;
    },
    set: function(value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'backOpacity', {
    get: function() {
        return this._windowBackSprite.alpha * 255;
    },
    set: function(value) {
        this._windowBackSprite.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'contentsOpacity', {
    get: function() {
        return this._windowContentsSprite.alpha * 255;
    },
    set: function(value) {
        this._windowContentsSprite.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Object.defineProperty(Window.prototype, 'openness', {
    get: function() {
        return this._openness;
    },
    set: function(value) {
        if (this._openness !== value) {
            this._openness = value.clamp(0, 255);
            this.updateOpenness();
        }
    },
    configurable: true
});

Window.prototype.updateOpenness = function(){
    if(this._windowBackSprite)
    {
        this._windowSpriteContainer.scale.y = this._openness / 255;
        this._windowSpriteContainer.y = this.height / 2 * (1 - this._openness / 255);
    }
};

Window.prototype.update = function() {
    if (this.active) {
        this._animationCount++;
    }
    this.children.forEach(function(child) {
        if (child.update) {
            child.update();
        }
    });
};

Window.prototype.move = function(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    if (this._width !== width || this._height !== height) {
        this._width = width || 0;
        this._height = height || 0;
        this._refreshAllParts();
    }
};

Window.prototype.isOpen = function() {
    return this._openness >= 255 && !this._closing;
};

Window.prototype.isClosed = function() {
    return this._openness <= 0 && !this._opening;
};

Window.prototype.setCursorRect = function(x, y, width, height) {
    var cx = Math.floor(x || 0);
    var cy = Math.floor(y || 0);
    var cw = Math.floor(width || 0);
    var ch = Math.floor(height || 0);
    var rect = this._cursorRect;
    if (rect.x !== cx || rect.y !== cy || rect.width !== cw || rect.height !== ch) {
        this._cursorRect.x = cx;
        this._cursorRect.y = cy;
        this._cursorRect.width = cw;
        this._cursorRect.height = ch;
        // this._refreshCursor();
    }
};

Window.prototype.setTone = function(r, g, b) {
    var tone = this._colorTone;
    if (r !== tone[0] || g !== tone[1] || b !== tone[2]) {
        this._colorTone = [r, g, b];
        this._refreshBack();
    }
};

Window.prototype.addChildToBack = function(child) {
    var containerIndex = this.children.indexOf(this._windowSpriteContainer);
    return this.addChildAt(child, containerIndex + 1);
};

Window.prototype.updateTransform = function() {
    this._updateCursor();
    this._updateContents();
    PIXI.Container.prototype.updateTransform.call(this);
};

Window.prototype._createAllParts = function() {
    this._windowSpriteContainer = new PIXI.Container();
    this._windowBackSprite = new Sprite();
    this._windowCursorSprite = new Sprite();
    this._windowFrameSprite = new Sprite();
    this._windowPauseSignSprite = new Sprite();
    this._windowContentsSprite = new Sprite();
    this._windowBackSprite.bitmap = new Bitmap(1, 1);
    this.addChild(this._windowSpriteContainer);
    this._windowSpriteContainer.addChild(this._windowBackSprite);
    this._windowSpriteContainer.addChild(this._windowFrameSprite);
    this.addChild(this._windowPauseSignSprite);
    this.addChild(this._windowCursorSprite);
    this.addChild(this._windowContentsSprite);
};

Window.prototype._onWindowskinLoad = function() {
    this._refreshAllParts();
};

Window.prototype._refreshAllParts = function() {
    this._refreshBack();
    this._refreshFrame();
    this._refreshContents();
};

Window.prototype._refreshBack = function() {
    var m = this._margin;
    var w = this._width - m * 2;
    var h = this._height - m * 2;
    var bitmap = new Bitmap(w, h);

    if(!this._windowBackSprite.bitmap)
       this._windowBackSprite.bitmap = bitmap;
};

Window.prototype._refreshFrame = function() {
    if(!this._showFrame)
        return;
    var w = this._width;
    var h = this._height;
    var m = 24;
    var bitmap = new Bitmap(w, h);

    this._windowFrameSprite.bitmap = bitmap;
    this._windowFrameSprite.setFrame(this.origin.x, this.origin.y, w, h);

    if (w > 0 && h > 0 && this._windowskin) {
        var skin = this._windowskin;
        var p = 96;
        var q = 96;
        bitmap.blt(skin, p+m, 0+0, p-m*2, m, m, 0, w-m*2, m);
        bitmap.blt(skin, p+m, 0+q-m, p-m*2, m, m, h-m, w-m*2, m);
        bitmap.blt(skin, p+0, 0+m, m, p-m*2, 0, m, m, h-m*2);
        bitmap.blt(skin, p+q-m, 0+m, m, p-m*2, w-m, m, m, h-m*2);
        bitmap.blt(skin, p+0, 0+0, m, m, 0, 0, m, m);
        bitmap.blt(skin, p+q-m, 0+0, m, m, w-m, 0, m, m);
        bitmap.blt(skin, p+0, 0+q-m, m, m, 0, h-m, m, m);
        bitmap.blt(skin, p+q-m, 0+q-m, m, m, w-m, h-m, m, m);
    }
};

Window.prototype._refreshContents = function() {
    this._windowContentsSprite.move(this.padding, this.padding);
};

Window.prototype._refreshPauseSign = function(filename) {
    this._windowPauseSignSprite.bitmap = ImageManager.loadBitmap(filename);
    this._windowPauseSignSprite.anchor.x = 0.5;
    this._windowPauseSignSprite.anchor.y = 1;
    this._windowPauseSignSprite.move(this._width / 2, this._height - this.standardPadding()/2);
    this._windowPauseSignSprite.alpha = 1;
};

Window.prototype._reposPauseSign = function(){
    this._windowPauseSignSprite.move(this._width / 2, this._height - this.standardPadding());
};

Window.prototype._updateCursor = function() {
    var blinkCount = this._animationCount % 40;
    var cursorOpacity = this.contentsOpacity;
    if (this.active) {
        if (blinkCount < 20) {
            cursorOpacity -= blinkCount * 8;
        } else {
            cursorOpacity -= (40 - blinkCount) * 8;
        }
    }
    this._windowPauseSignSprite.alpha = cursorOpacity / 255;
    this._windowPauseSignSprite.visible = this.isOpen() && this._paused;
};

Window.prototype._updateContents = function() {
    var w = this._width - this._padding * 2;
    var h = this._height - this._padding * 2;
    if (w > 0 && h > 0) {
        this._windowContentsSprite.setFrame(0, 0, w, h);
    } else {
        this._windowContentsSprite.visible = false;
    }
};

Window.prototype.isInsideFrame = function(x,y){
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Window.prototype.isWindowTouched = function(){
    let x = this.canvasToLocalX(TouchInput.x);
    let y = this.canvasToLocalY(TouchInput.y);
    return this.isInsideFrame(x,y);
};

function Window_Base() {
    this.initialize.apply(this, arguments);
}

Window_Base.prototype = Object.create(Window.prototype);
Window_Base.prototype.constructor = Window_Base;

Window_Base.prototype.initialize = function(x, y, width, height) {
    Window.prototype.initialize.call(this);
    this.move(x, y, width, height);
    this.updatePadding();
    this.updateBackOpacity();
    this.createContents();
    this._fontSize = 28;
    this._letterSpacing = 4;
    this._outlineWidth = 4;
    this._opening = false;
    this._closing = false;
    this._dimmerSprite = null;
};

Window_Base.prototype.lineHeight = function() {
    return this._lineHeight || 36;
};

Window_Base.prototype.standardFontFace = function() {
    if ($system.isChinese()) {
        return 'SimHei, Heiti TC, sans-serif';
    } else if ($system.isKorean()) {
        return 'Dotum, AppleGothic, sans-serif';
    } else {
        return 'sans-serif';
    }
};

Window_Base.prototype.standardFontSize = function() {
    return this._fontSize || 18;
};

Window_Base.prototype.standardLetterSpacing = function(){
    return this._letterSpacing;
};

Window_Base.prototype.standardOutlineWidth = function(){
    return this._outlineWidth || 4;
};

Window_Base.prototype.standardFontWidth = function(){
    if(this._fontWidth)
       this._fontWidth =  this._fontWidth.clamp(0,this._fontSize);
    return this._fontWidth || this._fontSize;
};

Window_Base.prototype.standardPadding = function() {
    return 18;
};

Window_Base.prototype.textPadding = function() {
    return 6;
};

Window_Base.prototype.updatePadding = function() {
    this.padding = this.standardPadding();
};

Window_Base.prototype.updateBackOpacity = function() {
    // this.backOpacity = this.standardBackOpacity();
};

Window_Base.prototype.contentsWidth = function() {
    return this.width - this._padding * 2;
};

Window_Base.prototype.contentsHeight = function() {
    return this.height - this._padding* 2;
};

Window_Base.prototype.fittingHeight = function(numLines) {
    return numLines * this.lineHeight() + this._padding * 2;
};

Window_Base.prototype.createContents = function() {
    this.contents = new Bitmap(this.contentsWidth(), this.contentsHeight(),'none');
    this.resetFontSettings();
};

Window_Base.prototype.resetFontSettings = function() {
    this.contents.fontFace = this.standardFontFace();
    this.contents.fontSize = this.standardFontSize();
    this.contents.outlineWidth = this.standardOutlineWidth();
    this.resetTextColor();
};

Window_Base.prototype.resetTextColor = function() {
    this.changeTextColor(this.normalColor());
    this.changeOutlineColor(this.outlineColor());
};

Window_Base.prototype.update = function() {
    Window.prototype.update.call(this);
    this.updateOpen();
    this.updateClose();
    this.updateBackgroundDimmer();
};

Window_Base.prototype.updateOpen = function() {
    if (this._opening) {
        this.openness += this._openStep;
        if (this.isOpen()) {
            this._opening = false;
        }
    }
};

Window_Base.prototype.updateClose = function() {
    if (this._closing) {
        this.openness -= this._closeStep;
        if (this.isClosed()) {
            this._closing = false;
        }
    }
};

Window_Base.prototype.open = function() {
    if (!this.isOpen()) {
        this._opening = true;
    }
    this._closing = false;
};

Window_Base.prototype.close = function() {
    if (!this.isClosed()) {
        this._closing = true;
    }
    this._opening = false;
};

Window_Base.prototype.isOpening = function() {
    return this._opening;
};

Window_Base.prototype.isClosing = function() {
    return this._closing;
};

Window_Base.prototype.show = function() {
    this.visible = true;
};

Window_Base.prototype.hide = function() {
    this.visible = false;
};

Window_Base.prototype.activate = function() {
    this.active = true;
};

Window_Base.prototype.deactivate = function() {
    this.active = false;
};

Window_Base.prototype.normalColor = function() {
    return this._normalColor || 'rgba(255,255,255,1)';
};

Window_Base.prototype.outlineColor = function(){
    return this._outlineColor || 'rgba(0,0,0,1)';
};

Window_Base.prototype.disabledOutline = function(){
    return this._disabledOutlineColor || 'rgba(0,0,0,1)';
}

Window_Base.prototype.disabledColor = function(){
    return this._disabledColor || 'rgba(138,138,138,1)';
};

Window_Base.prototype.systemColor = function() {
    return this._systemColor || 'rgba(150,150,150,1)';
};

Window_Base.prototype.translucentOpacity = function() {
    return 160;
};

Window_Base.prototype.changeTextColor = function(color) {
    this.contents.textColor = color;
};

Window_Base.prototype.changeOutlineColor = function(color){
    this.contents.outlineColor = color;
};

Window_Base.prototype.changePaintOpacity = function(enabled) {
    this.contents.paintOpacity = enabled ? 255 : this.translucentOpacity();
};

Window_Base.prototype.drawText = function(text, x, y, maxWidth, align) {
    this.contents.drawText(text, x, y, maxWidth, this.lineHeight(), align);
};

Window_Base.prototype.calcTextHeight = function(info){
    let tx = this.contents.fontSize*0.5;
    let ty = 0;
    this.contents.fontSize = 20;
    for(let i =0 ; i<info.length;++i){
        let spacing = this._letterSpacing;
        let text = info[i];
        let maxWidth = this.contents.fontSize;
        if(text.match(/[a-zA-Z]/)){
            if(text.match(/[a-z]/))
                maxWidth*=0.68;
            else if(text.match(/[A-Z]/))
                maxWidth *= 1.2;
        }
        if(info[i+1] &&  info[i+1].match(/[a-zA-Z]/)){
            spacing = 0;
        }
        if(tx +maxWidth >= this.contentsWidth()){
            tx = this.contents.fontSize*0.5;
            ty += this.lineHeight();
        }
        if(text === '/' && info[i+1] === 'n'){
            ty += this.lineHeight() *1.5;
            tx = this.contents.fontSize*0.5;
            i+=2;
        }
        tx += maxWidth + spacing*2;
    }
    return ty + this.lineHeight();
};


Window_Base.prototype.drawAllText = function(info){
    let tx = this.contents.fontSize*0.5;
    let ty = 0;

    for(let i =0 ; i<info.length;++i){
        let spacing = this._letterSpacing;
        let text = info[i];
        let maxWidth = this.contents.fontSize;
        if(text.match(/[a-zA-Z]/)){
            if(text.match(/[a-z]/))
                maxWidth*=0.68;
            else if(text.match(/[A-Z]/))
                maxWidth *= 1.2;
        }
        if(info[i] !== '/' && info[i+1] &&  info[i+1].match(/[a-zA-Z]/)){
            spacing = 0;
        }
        if(tx +maxWidth >= this.contentsWidth()){
            tx = this.contents.fontSize*0.5;
            ty += this.lineHeight();
        }
        if(text === '/' && info[i+1] === 'n'){
            ty += this.lineHeight()*1.5;
            tx = this.contents.fontSize*0.5;
            text = info[i+2];
            i+=2;
        }
        this.resetFontSettings();
        this.contents.fontSize = 24;
        this.contents.drawText(text,tx,ty,maxWidth,this.lineHeight(),'center');
        tx += maxWidth + spacing*2;
    }
};

Window_Base.prototype.textWidth = function(text) {
    return this.contents.measureTextWidth(text);
};

Window_Base.prototype.drawTextOneByOne = function(text,tx,ty){
    for(let i=0; i<text.length;++i){
        this.contents.drawText(text[i],tx,ty,this._fontSize,this.lineHeight(),'left');
        tx += this._fontSize;
        tx += this.standardLetterSpacing();
    }
};

Window_Base.prototype.convertEscapeCharacters = function(text) {
    text = text.replace(/\\/g, '\x1b');
    text = text.replace(/\x1b\x1b/g, '\\');
    text = text.replace(/\x1bV\[(\d+)\]/gi, function() {
        return $gameVariables.value(parseInt(arguments[1]));
    }.bind(this));
    text = text.replace(/\x1bV\[(\d+)\]/gi, function() {
        return $gameVariables.value(parseInt(arguments[1]));
    }.bind(this));
    text = text.replace(/\x1bN\[(\d+)\]/gi, function() {
        return this.actorName(parseInt(arguments[1]));
    }.bind(this));
    text = text.replace(/\x1bP\[(\d+)\]/gi, function() {
        return this.partyMemberName(parseInt(arguments[1]));
    }.bind(this));
    text = text.replace(/\x1bG/gi, TextManager.currencyUnit);
    return text;
};

Window_Base.prototype.processCharacter = function(textState) {
    switch (textState.text[textState.index]) {
        case '\n':
            this.processNewLine(textState);
            break;
        case '\f':
            this.processNewPage(textState);
            break;
        case '\x1b':
            this.processEscapeCharacter(this.obtainEscapeCode(textState), textState);
            break;
        default:
            this.processNormalCharacter(textState);
            break;
    }
};

Window_Base.prototype.processNormalCharacter = function(textState) {
    var c = textState.text[textState.index++];
    var w = this.textWidth(c);
    this.contents.drawText(c, textState.x, textState.y, w * 2, textState.height);
    textState.x += w;
};

Window_Base.prototype.processNewLine = function(textState) {
    textState.x = textState.left;
    textState.y += textState.height;
    textState.height = this.calcTextHeight(textState, false);
    textState.index++;
};

Window_Base.prototype.processNewPage = function(textState) {
    textState.index++;
};

Window_Base.prototype.obtainEscapeCode = function(textState) {
    textState.index++;
    var regExp = /^[\$\.\|\^!><\{\}\\]|^[A-Z]+/i;
    var arr = regExp.exec(textState.text.slice(textState.index));
    if (arr) {
        textState.index += arr[0].length;
        return arr[0].toUpperCase();
    } else {
        return '';
    }
};

Window_Base.prototype.obtainEscapeParam = function(textState) {
    var arr = /^\[\d+\]/.exec(textState.text.slice(textState.index));
    if (arr) {
        textState.index += arr[0].length;
        return parseInt(arr[0].slice(1));
    } else {
        return '';
    }
};

Window_Base.prototype.processEscapeCharacter = function(code, textState) {
    switch (code) {
        case 'C':
            this.changeTextColor(this.textColor(this.obtainEscapeParam(textState)));
            break;
        case '{':
            this.makeFontBigger();
            break;
        case '}':
            this.makeFontSmaller();
            break;
    }
};


Window_Base.prototype.makeFontBigger = function() {
    if (this.contents.fontSize <= 96) {
        this.contents.fontSize += 12;
    }
};

Window_Base.prototype.makeFontSmaller = function() {
    if (this.contents.fontSize >= 24) {
        this.contents.fontSize -= 12;
    }
};

// Window_Base.prototype.calcTextHeight = function(textState, all) {
//     var lastFontSize = this.contents.fontSize;
//     var textHeight = 0;
//     var lines = textState.text.slice(textState.index).split('\n');
//     var maxLines = all ? lines.length : 1;
//
//     for (var i = 0; i < maxLines; i++) {
//         var maxFontSize = this.contents.fontSize;
//         var regExp = /\x1b[\{\}]/g;
//         for (;;) {
//             var array = regExp.exec(lines[i]);
//             if (array) {
//                 if (array[0] === '\x1b{') {
//                     this.makeFontBigger();
//                 }
//                 if (array[0] === '\x1b}') {
//                     this.makeFontSmaller();
//                 }
//                 if (maxFontSize < this.contents.fontSize) {
//                     maxFontSize = this.contents.fontSize;
//                 }
//             } else {
//                 break;
//             }
//         }
//         textHeight += maxFontSize + 8;
//     }
//
//     this.contents.fontSize = lastFontSize;
//     return textHeight;
// };

Window_Base.prototype.setBackgroundType = function(type) {
    if (type === 0) {
        this.opacity = 255;
    } else {
        this.opacity = 0;
    }
    if (type === 1) {
        this.showBackgroundDimmer();
    } else {
        this.hideBackgroundDimmer();
    }
};

Window_Base.prototype.setBackgroundDimmer = function(filename){
    this._dimmerSprite = new Sprite(filename);
    this._dimmerSprite.visible = false;
    this.addChildToBack(this._dimmerSprite);
    this.updateBackgroundDimmer();
};

Window_Base.prototype.showBackgroundDimmer = function() {
    if (!this._dimmerSprite) {
        this._dimmerSprite = new Sprite();
        this._dimmerSprite.bitmap = new Bitmap(0, 0);
        this.addChildToBack(this._dimmerSprite);
    }
    var bitmap = this._dimmerSprite.bitmap;
    this._dimmerSprite.visible = true;
    if(!bitmap)
        return;
    if (bitmap.width !== this.width || bitmap.height !== this.height) {
        this.refreshDimmerBitmap();
    }
    this.updateBackgroundDimmer();
};

Window_Base.prototype.hideBackgroundDimmer = function() {
    if (this._dimmerSprite) {
        this._dimmerSprite.visible = false;
    }
};

Window_Base.prototype.updateBackgroundDimmer = function() {
    if (this._dimmerSprite) {
        this._dimmerSprite.opacity = this.openness;
    }
};

Window_Base.prototype.refreshDimmerBitmap = function() {

};

Window_Base.prototype.canvasToLocalX = function(x) {
    var node = this;
    while (node) {
        x -= node.x;
        node = node.parent;
    }
    return x;
};

Window_Base.prototype.canvasToLocalY = function(y) {
    var node = this;
    while (node) {
        y -= node.y;
        node = node.parent;
    }
    return y;
};

function Window_Title() {
    this.initialize.apply(this, arguments);
}

Window_Title.prototype = Object.create(Window_Base.prototype);
Window_Title.prototype.constructor = Window_Title;

Window_Title.prototype.initialize = function(normal,outline,x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._index = -1;
    this._stayCount = 0;
    this._normalColor = normal || 'rgba(255,255,255,255)';
    this._outlineColor = outline || 'rgba(5,5,5,255)';
    this._list = [];
    this._handlers = {};
    this._touching = false;
    this._openness = 0;

    this.refresh();
};

Window_Title.prototype.index = function() {
    return this._index;
};

Window_Title.prototype.itemHeight = function() {
    return this.lineHeight();
};

Window_Title.prototype.select = function(index) {
    this._index = index;
    this._stayCount = 0;
    this.refresh();
};

Window_Title.prototype.deselect = function() {
    this.select(-1);
    this.refresh();
};

Window_Title.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    rect.width = this._width;
    rect.height = this.lineHeight();
    rect.x = 0;
    rect.y = index * rect.height;
    return rect;
};

Window_Title.prototype.itemRectForText = function(index) {
    var rect = this.itemRect(index);
    rect.x += this.textPadding();
    rect.width -= this.textPadding() * 2;
    return rect;
};

Window_Title.prototype.setHandler = function(symbol, method) {
    this._handlers[symbol] = method;
};

Window_Title.prototype.isHandled = function(symbol) {
    return !!this._handlers[symbol];
};

Window_Title.prototype.callHandler = function(symbol) {
    if (this.isHandled(symbol)) {
        this._handlers[symbol]();
    }
};

Window_Title.prototype.isOpenAndActive = function() {
    return this.isOpen() && this.active;
};

Window_Title.prototype.isCursorMovable = function() {
    return this.isOpenAndActive();
};

Window_Title.prototype.cursorDown = function(wrap) {
    for(let i=this.index() +1; i<this._list.length;++i){
        if(this.isItemEnabled(i)){
            this.select(i);
            return;
        }
    }
};

Window_Title.prototype.cursorUp = function(wrap) {
    for(let i=this.index() -1; i>=0;i--){
        if(this.isItemEnabled(i)){
            this.select(i);
            return;
        }
    }
};

Window_Title.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    this.processCursorMove();
    this.processTouch();
    this.processHover();
    this._stayCount++;
};

Window_Title.prototype.processHover = function(){
    if(!TouchInput._hovered)
        return;
    if (this.isOpenAndActive()) {
        if (this.isHoverdInsideFrame()) {
            TouchInput._hovered = false;
            this.onHover(true);
        }
    }
};

Window_Title.prototype.processCursorMove = function() {
    if (this.isCursorMovable()){
        let lastIndex = this.index();
        if (Input.isRepeated('down')) {
            this.cursorDown(Input.isTriggered('down'));
        }
        if (Input.isRepeated('up')) {
            this.cursorUp(Input.isTriggered('up'));
        }
        if (Input.isRepeated('enter')){
            if(this.isItemEnabled(this._index))
                this.processOk();
        }
        if (this.index() !== lastIndex) {
            SoundManager.playCursor();
        }
    }
};

Window_Title.prototype.processTouch = function() {
    if (this.isOpenAndActive()) {
        if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
            this._touching = true;
            this.onTouch(true);
        }
        if (this._touching) {
            if (TouchInput.isPressed()) {
                this.onTouch(false);
            } else {
                this._touching = false;
            }
        }
    } else {
        this._touching = false;
    }
};

Window_Title.prototype.isTouchedInsideFrame = function() {
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Window_Title.prototype.isHoverdInsideFrame = function(){
    var x = this.canvasToLocalX(TouchInput._hoverX);
    var y = this.canvasToLocalY(TouchInput._hoverY);
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};


Window_Title.prototype.hitTest = function(x, y) {
    if (this.isContentsArea(x, y)) {
        var cx = x - this.padding;
        var cy = y - this.padding;
        for (var i = 0; i < this._list.length; i++) {
            if (i < this._list.length) {
                var rect = this.itemRect(i);
                var right = rect.x + rect.width;
                var bottom = rect.y + rect.height;
                if (cx >= rect.x && cy >= rect.y && cx < right && cy < bottom) {
                    return i;
                }
            }
        }
    }
    return -1;
};

Window_Title.prototype.onHover = function() {
    var lastIndex = this.index();
    var x = this.canvasToLocalX(TouchInput._hoverX);
    var y = this.canvasToLocalY(TouchInput._hoverY);
    var hitIndex = this.hitTest(x, y);
    if (hitIndex >= 0 && this.isItemEnabled(hitIndex) && this.isCursorMovable) {
        this.select(hitIndex);
    }
    if (this.index() !== lastIndex) {
        SoundManager.playCursor();
    }
};


Window_Title.prototype.onTouch = function(triggered) {
    var lastIndex = this.index();
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    var hitIndex = this.hitTest(x, y);
    if (hitIndex >= 0) {
        if (hitIndex === this.index()) {
            if (triggered && this.isItemEnabled(hitIndex)) {
                this.processOk();
            }
        } else if (this.isCursorMovable() && this.isItemEnabled(hitIndex)) {
            this.select(hitIndex);
        }
    } else if (this._stayCount >= 10) {
        if (y < this.padding) {
            this.cursorUp();
        } else if (y >= this.height - this.padding) {
            this.cursorDown();
        }
    }
    if(hitIndex<0)
        this.select(-1);
    if (this.index() !== lastIndex) {
        SoundManager.playCursor();
    }
};

Window_Title.prototype.isContentsArea = function(x, y) {
    var left = this.padding;
    var top = this.padding;
    var right = this.width - this.padding;
    var bottom = this.height - this.padding;
    return (x >= left && y >= top && x < right && y < bottom);
};

Window_Title.prototype.processOk = function() {
    if (this.isCurrentItemEnabled()) {
        this.playOkSound();
        this.updateInputData();
        this.callOkHandler();
    } else {
        this.playBuzzerSound();
    }
};

Window_Title.prototype.callOkHandler = function(){
    if(this.index() < this._list.length && this.index() >= 0){
        let handler = this._handlers[this._list[this.index()].symbol];
        if(handler)
            handler();
    }
};

Window_Title.prototype.updateInputData = function(){
    Input.update();
    TouchInput.update();
};

Window_Title.prototype.playOkSound = function() {
    SoundManager.playOk();
};

Window_Title.prototype.playBuzzerSound = function() {
    SoundManager.playBuzzer();
};

Window_Title.prototype.isCurrentItemEnabled = function() {
    return this._list[this._index].enabled;
};

Window_Title.prototype.isItemEnabled = function(index){
    if(index <0)
        return false;
    else if(index >= this._list.length)
        return false;
    else
        return this._list[index].enabled;
};

Window_Title.prototype.drawAllItems = function() {
    for (var i = 0; i < this._list.length; i++) {
        this.drawItem(i);
    }
    if(this._index < 0 && this._dimmerSprite)
        this._dimmerSprite.visible = false;
};

Window_Title.prototype.commandName = function(index){
    return this._list[index].name;
};

Window_Title.prototype.commandSymbol = function(index) {
    return this._list[index].symbol;
};

Window_Title.prototype.clearCommandList = function() {
    this._list = [];
};


Window_Title.prototype.addCommand = function(name, symbol, enabled, ext) {
    if (enabled === undefined) {
        enabled = true;
    }
    if (ext === undefined) {
        ext = null;
    }
    this._list.push({ name: name, symbol: symbol, enabled: enabled || false, ext: ext});
    this.refresh();
};


Window_Title.prototype.drawItem = function(index) {
    if(index >= this._list.length)
        return;
    var rect = this.itemRectForText(index);
    var align = 'center';
    this.resetFontSettings();
    this.resetTextColor();
    this.changeTextColor(this.isItemEnabled(index)? this.normalColor(): this.disabledColor());
    this.changeOutlineColor(this.isItemEnabled(index)?this.outlineColor(): this.disabledOutline());
    let text = this.commandName(index);
    let tx = rect.x;
    this.changeTextSelected(index === this._index);
    tx += (rect.width - text.length*(this._fontWidth+this._letterSpacing*2))/2;
    for(let i=0; i< text.length;++i) {
        let t = text[i];
        tx += this._letterSpacing;
        let maxWidth = this._fontWidth;
        this.drawText(text[i], tx, rect.y, maxWidth, 'center');
        tx += maxWidth+ this._letterSpacing;
    }
};

Window_Title.prototype.changeTextSelected = function(selected){
    if(selected && this._dimmerSprite){
        let rect = this.itemRect(this._index);
        this._dimmerSprite.anchor.x = 0.5;
        this._dimmerSprite.visible = true;
        this._dimmerSprite.x = this._width*0.55;
        this._dimmerSprite .y = rect.y+this._padding-5;
    }
};

Window_Title.prototype.clearItem = function(index) {
    var rect = this.itemRect(index);
    this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
};

Window_Title.prototype.refresh = function() {
    if (this.contents) {
        this.contents.clear();
        this.drawAllItems();
    }
};

Window_Title.prototype.updateOpenness = function(){
    if(this._windowContentsSprite)
    {
        this._windowContentsSprite.height = this._openness/255*this.contentsHeight();
        this._windowContentsSprite.opacity = this._openness/255*255;
    }
};