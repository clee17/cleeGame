//=============================================================================
// Partly from RPGMAKER_MV 1.6.2
// Partly original by cleeGame 1.0.0
//=============================================================================

/**
 * Returns a number whose value is limited to the given range.
 *
 * @method Number.prototype.clamp
 * @param {Number} min The lower boundary
 * @param {Number} max The upper boundary
 * @return {Number} A number in the range (min, max)
 */
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

/**
 * Returns a modulo value which is always positive.
 *
 * @method Number.prototype.mod
 * @param {Number} n The divisor
 * @return {Number} A modulo value
 */
Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

/**
 * Replaces %1, %2 and so on in the string to the arguments.
 *
 * @method String.prototype.format
 * @param {Any} ...args The objects to format
 * @return {String} A formatted string
 */
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/%([0-9]+)/g, function(s, n) {
        return args[Number(n) - 1];
    });
};

/**
 * Makes a number string with leading zeros.
 *
 * @method String.prototype.padZero
 * @param {Number} length The length of the output string
 * @return {String} A string with leading zeros
 */
String.prototype.padZero = function(length){
    var s = this;
    while (s.length < length) {
        s = '0' + s;
    }
    return s;
};

/**
 * Makes a number string with leading zeros.
 *
 * @method Number.prototype.padZero
 * @param {Number} length The length of the output string
 * @return {String} A string with leading zeros
 */
Number.prototype.padZero = function(length){
    return String(this).padZero(length);
};

Object.defineProperties(Array.prototype, {
    /**
     * Checks whether the two arrays are same.
     *
     * @method Array.prototype.equals
     * @param {Array} array The array to compare to
     * @return {Boolean} True if the two arrays are same
     */
    equals: {
        enumerable: false,
        value: function(array) {
            if (!array || this.length !== array.length) {
                return false;
            }
            for (var i = 0; i < this.length; i++) {
                if (this[i] instanceof Array && array[i] instanceof Array) {
                    if (!this[i].equals(array[i])) {
                        return false;
                    }
                } else if (this[i] !== array[i]) {
                    return false;
                }
            }
            return true;
        }
    },
    /**
     * Makes a shallow copy of the array.
     *
     * @method Array.prototype.clone
     * @return {Array} A shallow copy of the array
     */
    clone: {
        enumerable: false,
        value: function() {
            return this.slice(0);
        }
    },
    /**
     * Checks whether the array contains a given element.
     *
     * @method Array.prototype.contains
     * @param {Any} element The element to search for
     * @return {Boolean} True if the array contains a given element
     */
    contains : {
        enumerable: false,
        value: function(element) {
            return this.indexOf(element) >= 0;
        }
    }
});

/**
 * Checks whether the string contains a given string.
 *
 * @method String.prototype.contains
 * @param {String} string The string to search for
 * @return {Boolean} True if the string contains a given string
 */
String.prototype.contains = function(string) {
    return this.indexOf(string) >= 0;
};

/**
 * Generates a random integer in the range (0, max-1).
 *
 * @static
 * @method Math.randomInt
 * @param {Number} max The upper boundary (excluded)
 * @return {Number} A random integer
 */
Math.randomInt = function(max) {
    return Math.floor(max * Math.random());
};

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

Number.prototype.toCChar = function(){
    var unit='';
   switch(this.valueOf()){
       case 0:
           unit='零';
           break;
       case 1:
           unit='一';
           break;
       case 2:
           unit='二';
           break;
       case 3:
           unit='三';
           break;
       case 4:
           unit='四';
           break;
       case 5:
           unit='五';
           break;
       case 6:
           unit='六';
           break;
       case 7:
           unit='七';
           break;
       case 8:
           unit='八';
           break;
       case 9:
           unit='九';
           break;
       default:
           break;
   }
   return unit;
};

Number.prototype.toCString = function(){
    var str = '';
    var unit=  ['','十','百','千','万'];
    var index = 0;
    var count = this.valueOf();
    if(count ==0)
        return '零';
    while(count>=1)
    {
        str = (count%10).toCChar()+unit[index]+str;
        count = parseInt(count/10);
        ++index;
    }
    if(str.slice(-1) === '零')
        str = str.substring(0,str.substring.length);
    return str;
};

Number.prototype.toCStringL = function(){
    var str1= '';
    var str2 = '';
    var unit=  ['','十','百','千','万'];
    var num1 = this %10000;
    var num2 = this %10000000;
    var index = 0;
    if(num2!= num1)
    {
        str1 = ((num2-num1)/10000).toCString()+'万';
    }

    let result = str1+num1.toCString();
    if(result.slice(-1) ==='零')
        result = result.substring(0,str.substring.length);
    return result;
};


//-----------------------------------------------------------------------------
/**
 * The static class that handles JSON with object information.
 *
 * @class JsonEx
 */
function JsonEx() {
    throw new Error('This is a static class');
}

/**
 * The maximum depth of objects.
 *
 * @static
 * @property maxDepth
 * @type Number
 * @default 100
 */
JsonEx.maxDepth = 100;

JsonEx._id = 1;
JsonEx._generateId = function(){
    return JsonEx._id++;
};

/**
 * Converts an object to a JSON string with object information.
 *
 * @static
 * @method stringify
 * @param {Object} object The object to be converted
 * @return {String} The JSON string
 */
JsonEx.stringify = function(object) {
    var circular = [];
    JsonEx._id = 1;
    var json = JSON.stringify(this._encode(object, circular, 0));
    this._cleanMetadata(object);
    this._restoreCircularReference(circular);

    return json;
};

JsonEx._restoreCircularReference = function(circulars){
    circulars.forEach(function(circular){
        var key = circular[0];
        var value = circular[1];
        var content = circular[2];

        value[key] = content;
    });
};

/**
 * Parses a JSON string and reconstructs the corresponding object.
 *
 * @static
 * @method parse
 * @param {String} json The JSON string
 * @return {Object} The reconstructed object
 */
JsonEx.parse = function(json) {
    var circular = [];
    var registry = {};
    var contents = this._decode(JSON.parse(json), circular, registry);
    this._cleanMetadata(contents);
    this._linkCircularReference(contents, circular, registry);

    return contents;
};

JsonEx._linkCircularReference = function(contents, circulars, registry){
    circulars.forEach(function(circular){
        var key = circular[0];
        var value = circular[1];
        var id = circular[2];

        value[key] = registry[id];
    });
};

JsonEx._cleanMetadata = function(object){
    if(!object) return;

    delete object['@'];
    delete object['@c'];

    if(typeof object === 'object'){
        Object.keys(object).forEach(function(key){
            var value = object[key];
            if(typeof value === 'object'){
                JsonEx._cleanMetadata(value);
            }
        });
    }
};


/**
 * Makes a deep copy of the specified object.
 *
 * @static
 * @method makeDeepCopy
 * @param {Object} object The object to be copied
 * @return {Object} The copied object
 */
JsonEx.makeDeepCopy = function(object) {
    return this.parse(this.stringify(object));
};

/**
 * @static
 * @method _encode
 * @param {Object} value
 * @param {Array} circular
 * @param {Number} depth
 * @return {Object}
 * @private
 */
JsonEx._encode = function(value, circular, depth) {
    depth = depth || 0;
    if (++depth >= this.maxDepth) {
        throw new Error('Object too deep');
    }
    var type = Object.prototype.toString.call(value);
    if (type === '[object Object]' || type === '[object Array]') {
        value['@c'] = JsonEx._generateId();

        var constructorName = this._getConstructorName(value);
        if (constructorName !== 'Object' && constructorName !== 'Array') {
            value['@'] = constructorName;
        }
        for (var key in value) {
            if (value.hasOwnProperty(key) && !key.match(/^@./)) {
                if(value[key] && typeof value[key] === 'object'){
                    if(value[key]['@c']){
                        circular.push([key, value, value[key]]);
                        value[key] = {'@r': value[key]['@c']};
                    }else{
                        value[key] = this._encode(value[key], circular, depth + 1);

                        if(value[key] instanceof Array){
                            //wrap array
                            circular.push([key, value, value[key]]);

                            value[key] = {
                                '@c': value[key]['@c'],
                                '@a': value[key]
                            };
                        }
                    }
                }else{
                    value[key] = this._encode(value[key], circular, depth + 1);
                }
            }
        }
    }
    depth--;
    return value;
};

/**
 * @static
 * @method _decode
 * @param {Object} value
 * @param {Array} circular
 * @param {Object} registry
 * @return {Object}
 * @private
 */
JsonEx._decode = function(value, circular, registry) {
    var type = Object.prototype.toString.call(value);
    if (type === '[object Object]' || type === '[object Array]') {
        registry[value['@c']] = value;

        if (value['@']) {
            var constructor = window[value['@']];
            if (constructor) {
                value = this._resetPrototype(value, constructor.prototype);
            }
        }
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if(value[key] && value[key]['@a']){
                    //object is array wrapper
                    var body = value[key]['@a'];
                    body['@c'] = value[key]['@c'];
                    value[key] = body;
                }
                if(value[key] && value[key]['@r']){
                    //object is reference
                    circular.push([key, value, value[key]['@r']])
                }
                value[key] = this._decode(value[key], circular, registry);
            }
        }
    }
    return value;
};

/**
 * @static
 * @method _getConstructorName
 * @param {Object} value
 * @return {String}
 * @private
 */
JsonEx._getConstructorName = function(value) {
    var name = value.constructor.name;
    if (name === undefined) {
        var func = /^\s*function\s*([A-Za-z0-9_$]*)/;
        name = func.exec(value.constructor)[1];
    }
    return name;
};

/**
 * @static
 * @method _resetPrototype
 * @param {Object} value
 * @param {Object} prototype
 * @return {Object}
 * @private
 */
JsonEx._resetPrototype = function(value, prototype) {
    if (Object.setPrototypeOf !== undefined) {
        Object.setPrototypeOf(value, prototype);
    } else if ('__proto__' in value) {
        value.__proto__ = prototype;
    } else {
        var newValue = Object.create(prototype);
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                newValue[key] = value[key];
            }
        }
        value = newValue;
    }
    return value;
};


//-----------------------------------------------------------------------------
/**
 * The static class that defines utility methods.
 *
 * @class Utils
 */
function Utils() {
    throw new Error('This is a static class');
}

/**
 * The name of the RPG Maker. 'MV' in the current version.
 *
 * @static
 * @property RPGMAKER_NAME
 * @type String
 * @final
 */
Utils.RPGMAKER_NAME = 'MV';

/**
 * The version of the RPG Maker.
 *
 * @static
 * @property RPGMAKER_VERSION
 * @type String
 * @final
 */
Utils.RPGMAKER_VERSION = "1.6.1";

/**
 * Checks whether the option is in the query string.
 *
 * @static
 * @method isOptionValid
 * @param {String} name The option name
 * @return {Boolean} True if the option is in the query string
 */
Utils.isOptionValid = function(name) {
    if (location.search.slice(1).split('&').contains(name)) {return 1;};
    if (typeof nw !== "undefined" && nw.App.argv.length > 0 && nw.App.argv[0].split('&').contains(name)) {return 1;};
    return 0;
};

/**
 * Checks whether the platform is NW.js.
 *
 * @static
 * @method isNwjs
 * @return {Boolean} True if the platform is NW.js
 */
Utils.isNwjs = function() {
    return typeof require === 'function' && typeof process === 'object';
};

/**
 * Checks whether the platform is a mobile device.
 *
 * @static
 * @method isMobileDevice
 * @return {Boolean} True if the platform is a mobile device
 */
Utils.isMobileDevice = function() {
    var r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return !!navigator.userAgent.match(r);
};

/**
 * Checks whether the browser is Mobile Safari.
 *
 * @static
 * @method isMobileSafari
 * @return {Boolean} True if the browser is Mobile Safari
 */
Utils.isMobileSafari = function() {
    var agent = navigator.userAgent;
    return !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) &&
        !agent.match('CriOS'));
};

/**
 * Checks whether the browser is Android Chrome.
 *
 * @static
 * @method isAndroidChrome
 * @return {Boolean} True if the browser is Android Chrome
 */
Utils.isAndroidChrome = function() {
    var agent = navigator.userAgent;
    return !!(agent.match(/Android/) && agent.match(/Chrome/));
};

/**
 * Checks whether the browser can read files in the game folder.
 *
 * @static
 * @method canReadGameFiles
 * @return {Boolean} True if the browser can read files in the game folder
 */
Utils.canReadGameFiles = function() {
    var scripts = document.getElementsByTagName('script');
    var lastScript = scripts[scripts.length - 1];
    var xhr = new XMLHttpRequest();
    try {
        xhr.open('GET', lastScript.src);
        xhr.overrideMimeType('text/javascript');
        xhr.send();
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Makes a CSS color string from RGB values.
 *
 * @static
 * @method rgbToCssColor
 * @param {Number} r The red value in the range (0, 255)
 * @param {Number} g The green value in the range (0, 255)
 * @param {Number} b The blue value in the range (0, 255)
 * @return {String} CSS color string
 */
Utils.rgbToCssColor = function(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};

Utils._id = 1;
Utils.generateRuntimeId = function(){
    return Utils._id++;
};

Utils._supportPassiveEvent = null;
/**
 * Test this browser support passive event feature
 *
 * @static
 * @method isSupportPassiveEvent
 * @return {Boolean} this browser support passive event or not
 */
Utils.isSupportPassiveEvent = function() {
    if (typeof Utils._supportPassiveEvent === "boolean") {
        return Utils._supportPassiveEvent;
    }
    // test support passive event
    // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
    var passive = false;
    var options = Object.defineProperty({}, "passive", {
        get: function() { passive = true; }
    });
    window.addEventListener("test", null, options);
    Utils._supportPassiveEvent = passive;
    return passive;
};
