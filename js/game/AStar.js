function AStar(){
    return ' this is a static class';
}

AStar.initializeInfo = function(current,parent){
    let size = this._size;
    let posX = Math.floor(current%size.width);
    let posY = Math.floor(current/size.width);
    let h = Math.abs(posX - this._target.x)+Math.abs(posY - this._target.y);
    h*=10;
    let g = 10;
    if(parent === undefined)
        parent = null;
    let tmpParent = parent;
    while(parent !== null){
        let info = this._listInfo[parent.toString()];
        g+= parent.g || 0;
        parent = info.parent;
    }
    return  {g:g,h:h,f:g+h,index:current,parent:tmpParent};
};

AStar.optimize4 = function(current,target){
    if(this._open.indexOf(target)<0){
        this._open.push(target);
        this._listInfo[target.toString()] = this.initializeInfo(target,current);
    }else{
        let info = this._listInfo[target.toString()];
        if(info.g > this._listInfo[current.toString()].g+10){
            info.parent = current;
            info.g = this._listInfo[current.toString()].g+10;
            info.f = info.g+info.h;
        }
    }
};

AStar.calculate4 = function(current,size,map){
    let width = this._size.width;
    let height = this._size.height;
    let posX = Math.floor(current%size.width);
    let posY = Math.floor(current/size.width);
    if(posX-1 >=0 && map[current-1] && this._closed.indexOf(current-1) === -1){
        this.optimize4(current,current-1);
    }
    if(posX+1 < size.width && map[current+1] && this._closed.indexOf(current+1) === -1){
        this.optimize4(current,current+1);
    }
    if(posY+1 < size.height && map[current+width] && this._closed.indexOf(current+width) === -1){
        this.optimize4(current,current+width);
    }
    if(posY-1 >=0 && map[current-width] && this._closed.indexOf(current-width) === -1){
        this.optimize4(current,current-width);
    }
};

AStar.getLowestF = function(){
    let current = this._open[0];
    let currentInfo = this._listInfo[current.toString()];
    for(let i=0; i<this._open.length;++i){
        let index = this._open[i];
        let info  = this._listInfo[index.toString()];
        if(info && info.f <= currentInfo.f){
            current = this._open[i];
            currentInfo = this._listInfo[current.toString()];
        }
    }
    return current;
};

AStar.searchMap4 = function(current,target,size,map){
    this._open  = [];
    this._closed = [];
    this._listInfo = {};
    this._size = size;
    this._current = {index:current,x:Math.floor(current%size.width),y:Math.floor(current/size.width)};
    this._target = {index:target,x:Math.floor(target%size.width),y:Math.floor(target/size.width)};
    this._closed.push(current);
    this._listInfo[current.toString()] = this.initializeInfo(current);
    while(this._closed.indexOf(target) === -1){
         this.calculate4(current,size,map);
         current = this.getLowestF();
         this._closed.push(current);
         if(this._open.indexOf(current) >= 0)
             this._open.splice(this._open.indexOf(current),1);
    };
    let result = [];
    let lastInfo = this._listInfo[target.toString()];
    while(lastInfo.parent !== null){
        result.unshift(lastInfo.index);
        lastInfo = this._listInfo[lastInfo.parent.toString()];
    }
    return result;
};