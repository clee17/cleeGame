
/*Number extensions*/
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

Number.prototype.padZero = function(length){
    return String(this).padZero(length);
};


/*string extensions*/
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/%([0-9]+)/g, function(s, n) {
        return args[Number(n) - 1];
    });
};

String.prototype.padZero = function(length){
    var s = this;
    while (s.length < length) {
        s = '0' + s;
    }
    return s;
};

String.prototype.contains = function(string){
    return this.indexof(string) >=0;
};

/*Math*/

Math.randomInt = function(max, bottomValue){
    if(bottomValue == null)
        bottomValue = 0;
    return Math.floor(max*Math.random())+bottomValue;
}


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

/*  Color
*
*
* */
function color(){
    throw new Error('This is a static class');
}

color.rgbToCssColor = function(r,g,b){
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};