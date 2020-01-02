/*
* Cache manager
*
 */

function CacheEntry(cache,key,item){
    this.cache = cache;
    this.key = key;
    this.item = item;
    this.cached = false;
    this.touchTicks = 0;
    this.touchSeconds = 0;
    this.ttlTicks = 0;
    this.ttlSeconds = 0;
    this.freeByTTL = false;
}

CacheEntry.prototype.free = function(byTTL){
    this.freeByTTL = byTTL || false;
    if(this.cached){
        this.cached = false;
        delete this.cache._inner[this.key];
    }
};

CacheEntry.prototype.allocate = function(){
  if(!this.cached){
      this.cache._inner[this.key] = this;
      this.cached = true;
  }
  this.touch();
  return this;
};

CacheEntry.prototype.touch = function(){
  var cache = this.cache;
  if(this.cached){
      this.touchTicks = cache.updateTicks;
      this.touchSeconds = cache.updateSeconds;
  }else if(this.freedByTTL){
      this.freedByTTL = false;
      if(!chace._inner[this.key]){
          cache._inner[this.key] = this;
      }
  }
};

CacheEntry.prototype.setTimeToLive=  function(ticks,seconds){
    this.ttlTicks = ticks || 0;
    this.ttlSeconds = seconds || 0;
    return this;
};

CacheEntry.prototype.isStillAlive =  function(){
    var cache = this.cache;
    return ((this.ttlTicks == 0) || (this.touchTicks + this.ttlTicks < cache.updateTicks )) &&
        ((this.ttlSeconds == 0) || (this.touchSeconds + this.ttlSeconds < cache.updateSeconds ));
};


function CacheMap(manager){
    this.manager = manager;
    this._inner = {};
    this._lastRemovedEntries = {};
    this.updateTicks = 0;
    this.lastCheckTTL = 0;
    this.delayCheckTTL = 0;
    this.updateSeconds = Date.now();
}

CacheMap.prototype.checkTTL = function(){
      var cache = this._inner;
      var temp = this._lastREmovedEntries;
      if(!temp){
          temp = [];
          this._lastRemovedEntries = temp;
      }
      for(var key in cache){
          var entry = cache[key];
          if(!entry.isStillAlive()){
              temp.push(entry);
          }
      }
      for(var i=0;i < temp.length; i++){
          temp[i].free(true);
      }
      temp.length = 0;
};

CacheMap.prototype.clear = function(){
  var keys = Object.keys(this._inner);
  for(var i =0; i< keys.length;i++){
      this._inner[keys[i]].free();
  }
};

CacheMap.prototype.getItem = function(key){
    var entry = this._inner[key];
    if(entry) {
        return entry.item;
    }
};

CacheMap.prototype.setItem = function(key,item){
    return new CacheEntry(this,key,item).allocate();
};

CacheMap.prototype.update = function(ticks,delta){
  this.updateTicks += ticks;
  this.updateSeconds += delta;
  if(this.updateSeconds >= this.delayCheckTTL + this.lastCheckTTL){
      this.lastCheckTTL = this.updateSeconds;
      this.checkTTL();
  }
};

console.log('finished loading game_cache');