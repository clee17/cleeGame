function Event_Cache(){
    this.initialize.apply(this, arguments);
}

Event_Cache.prototype.initialize = function(event) {
    this.info = event;
    this._contents = this.info.contents || [];
    this._type = event.type || 'text';
    this._maxLength = this._contents.length;
    this._pointer = 0;
};

Event_Cache.prototype.isTalkEvent = function(){
    return this._type === 'text' || this._type.indexOf("Text") >= 0;
};

Event_Cache.prototype.isMapEvent = function(){
    return this._type.indexOf("map") >=0;
};

Event_Cache.prototype.isChallenge = function(){
    return this._type === 'challenge';
};

Event_Cache.prototype.isEnd = function(){
    if(this.isTalkEvent)
       return this._pointer >= this._contents.length-1;
    else
        return this.final;
};

Event_Cache.prototype.getDialog = function(){
    let result  = [];
    for(let i =this._pointer;i<this._maxLength;++i){
        let event = this._contents[i];
        let eventDetail = Game_Database.getData('dialog',event);
        if(eventDetail)
             result.push(eventDetail);
        this._pointer = i;
    }
    return result;
};

Event_Cache.prototype.getValue = function(value){
    return this.info[value];
};

GameManager._event = null;
GameManager._mapUpdated = false;
GameManager._backpackUpdated = null;
GameManager._playerUpdated = false;
GameManager._alertChanged = false;
GameManager._infoChange = {};
GameManager._stashedEvent = [];
GameManager._backpack = [];
GameManager._backpackChange = null;

GameManager.initialize = function(){
    if(this._game.map === undefined)
        this._game.map = 0;
    if(!this._game._completedEvent)
        this._game._completedEvent = [];
    if(!this._game._completedEventHidden)
        this._game._completedEventHidden = [];
    if(!this._game._completedEventMap)
        this._game._completedEventMap = [];
    if(!this._game._completedTask)
        this._game._completedTask = [];
    if(!this._game._task)
        this._game._task = [];
    if(typeof this._game._event != 'number')
        this._game._event = 0;

    this._mapChanged = true;
    this._infoChange['hp'] = true;
    for(let i = 0; i<this._game.backpack.length;++i){
        this._game.backpack[i].updated = true;
    }
};

GameManager.getLevel = function(){
    if(this._game['level'] !== undefined)
        return this._game['level'];
    else
        viewport.printError(gameText[0]);
};

GameManager.getHp = function(){
    if(this._game['hp'] !== undefined){
           let info = {hp:this._game['hp'], max:this._game['maxHP']};
           return info;
    }
    return null;
};

GameManager.getStep = function(){
    if(this._game['step'] !== undefined){
        let info = {step:this._game['step'], max:this._game['maxStep']};
        return info;
    }
    return null;
};


GameManager.getCurrentTask = function(type){
     let result = [];
     type = type || 0;
     let task = this._game._task;
     for(let i=0; i<task.length;++i){
         let taskInfo = Game_Database.getData('task',task[i]);
         if(taskInfo && taskInfo.type === type)
             result.push(taskInfo);
     }
     return result;
};

GameManager.getCurrentMap = function(){
    let mapInfo = Game_Database.getMap(this._game.map);
    return mapInfo;
};

GameManager.changeMap = function(index){
    if(this.isTalkEvent())
        return;
    this._game.map = index;
    if(this._game.map >0){
        this._backpack = [];
        this._mapInfo = Game_Database.getMap(this._game.map);
    }
    this._mapChanged = true;
};

GameManager.loadChallenge = function(){
    this._game.step = this._game.maxStep;
    this._infoChange['step'] = true;
};

GameManager.getUser = function(){
    let userInfo = {};
    userInfo.hp = this._game._hp;
    userInfo.step = this._game._step;
    return userInfo;
};

GameManager.checkCondition = function(condition){
    if(!condition)
        return true;
    for(let attr in condition){
        let value = GameManager.getValue(attr);
        if(!Game_Database.compareValue(value,condition[attr]))
            return false;
    }
    return true;
};

GameManager.updateAutoEvents = function(){
    let events = Game_Database.getList('event');
    if(!this._processing){
        for(let i=0; i<events.length;++i){
            let event = events[i];
            if(GameManager.checkCondition(event.condition) && this._game._completedEvent.indexOf(event.index) === -1 && !this._event){
                this.startEvent(event.index);
                break;
            }
        }
    }
};

GameManager.startEvent = function(index){
    if(Game_Database.getData('event',index)){
        this._processing = true;
        this._event = new Event_Cache(Game_Database.getData('event',index));
    }

};

GameManager.isEventStarted = function(){
    return !!this._event;
};

GameManager.isTalkEvent = function(){
   return this._event && this._event.isTalkEvent();
};

GameManager.isChallenge = function(){
    return this._event && this._event.isChallenge();
};

GameManager.getCurrentText = function(){
    return this._event.getDialog();
};

GameManager.updateValue = function(value,exec){
    if(!this._game[value])
        return;
    for(let attr in exec){
        if(attr === '$set')
            this._game[value] = exec[attr];
        else if (attr === '$inc')
            this._game[value] += exec[attr];
        else if (attr === '$dec')
            this._game[value] -= exec[attr];
    }
    this._infoChange[value] = true;
};

GameManager.addToBackpack = function(itemInfo,realBackpack){
    let backpack = this._game.backpack;
    if(!realBackpack)
        backpack = this._backpack;
    for(let i=0; i< backpack.length;++i){
        if(backpack[i].index === itemInfo.index){
            backpack[i].num += itemInfo.num;
            return;
        }
    };
    backpack.push({index:itemInfo.index,num:itemInfo.num});
};

GameManager.mergeBackpack = function(){
    let backpack = this._backpack;
    for(let i=0; i <backpack.length;++i){
        this.addToBackpack(backpack[i],true);
    }
    this._backpack = [];
};

GameManager.resultEvent = function(){
    let resultInfo = this._event.getValue('result');
    if(resultInfo){
        for(let attr in resultInfo){
            this.updateValue(attr,resultInfo[attr]);
            if(attr === 'map')
                this._mapChanged = true;
        }
    }
    let fallIndex = this._event.getValue('fall');
    if(!fallIndex)
        return;
    this._backPackChange = [];
    for(let i =0; i <fallIndex.length;++i){
        let fallInfo = Game_Database.getData('fall',fallIndex[i]);
        let itemIndex = fallInfo.item;
        let itemNum = Math.randomInt(fallInfo.num[1]-fallInfo.num[0])+fallInfo.num[0];
        this._backPackChange.push({num:itemNum,index:itemIndex});
    }
    for(let i =0; i<this._backPackChange.length;++i){
        this.addToBackpack(this._backPackChange[i]);
    };
};

GameManager.refreshTask = function(){
    let taskInfo = this._event.getValue('task');
    if(!taskInfo)
        return;
    if(taskInfo.add)
        this._game._task = this._game._task.concat(taskInfo.add);
    if(taskInfo.complete)
        this._game._completedTask =  this._game._completedTask.concat(taskInfo.complete);
    for(let i= 0; i<this._game._completedTask.length;++i){
        let index = this._game._completedTask[i];
        while(this._game._task.indexOf(index)>=0){
            this._game._task.splice(this._game._task.indexOf(index),1);
        }
    }
    this._infoChange['task'] = true;
};

GameManager.completeEvent = function(){
    if(this._event.callback){
        let callback = this._event.callback;
        callback();
    }
    this._eventChanged = true;
    this._processing = false;
    this._event = null;
    if(this._stashedEvent.length > 0){
        this._event = this._stashedEvent.pop();
    }

};

GameManager.storeEvent = function(){
    if(this._event && this._event._type.indexOf('map') <0){
        this._game._completedEvent.push(this._event.getValue('index'));
    }else if (this._event && !this._event.getValue('repeat')){
        if(this._event.getValue('hidden'))
             this._game._completedEventHidden.push(this._event.getValue('index'));
        else
            this._game._completedEventMap.push(this._event.getValue('index'));
    }
};

GameManager.refreshEvent = function(){
    this._event.pointer++;
    if(this._event.isEnd()){
        this.storeEvent();
        this.resultEvent();
        this.refreshTask();
        this.completeEvent();
    }else
        viewport.printError('some error happened, please report the bug you encountered to the author');
};



GameManager.getMapTarget = function(){
    if(this._mapInfo && this._mapInfo.target)
        return this._mapInfo.target;
};

GameManager.getMapEnd = function(){
    if(typeof this._endPoint === 'number')
        return this._endPoint;
};

GameManager.setEndPoint = function(endPoint){
   if(this._game._map){
       this._mapInfo._endPoint = endPoint;
   }
};

GameManager.playerStatus = function(){
    return {step:this._game.step,hp:this._game.hp};
};

GameManager.moveStep = function(tileInfo){
    this._game.step += tileInfo.step;
    this._game.hp += tileInfo.hp;
    this._game.hp =  this._game.hp.clamp(0,this._game.maxHP || 100);
    this._game.step = this._game.step.clamp(0,this._game.maxStep || 100);
    this._infoChange['hp'] = true;
    this._infoChange['step'] = true;
    return this.playerStatus();
};

GameManager.randomEvents = function(events){
    let maxRate = 0;
    let step = [];
    for(let i = 0; i<events.length;++i){
        let event = events[i];
        maxRate += event.rate;
        step.push(maxRate);
    }
    if(maxRate === 0)
        return null;
    let int = Math.randomInt(maxRate);
    if(int < step[0])
        return events[0];
    for(let i=0;i<step.length-1;++i){
        if(int > step[i] && int <= step[i+1])
            return events[i+1];
    }
    return events.pop();
};

GameManager.isMapEventOK = function(event){
    let info = Game_Database.getData('event_map',event.index);
    let ifPrev = true;
    let ifRepeat = false;
    if(typeof info.prev === 'number'){
        let prevEvent = Game_Database.getData('event_map',info.prev);
        if(prevEvent.hidden)
           ifPrev=  this._game._completedEventHidden.indexOf(prevEvent.index)>=0;
        else
            ifPrev = this._game._completedEventMap.indexOf(prevEvent.index) >= 0;
    }
    if(info.repeat !== undefined && !info.repeat){
        if(info.hidden)
            ifRepeat = this._game._completedEventHidden.indexOf(info.index)>=0;
        else
            ifRepeat = this._game._completedEventMap.indexOf(info.index)>=0;
    }
    let result =  ifPrev && (!ifRepeat);
    return result;
};

GameManager.processMapEvent = function(tileInfo,callback){
    let events = tileInfo.events || [];
    events = JSON.parse(JSON.stringify(events));
    let event = this.randomEvents(events);
    while(event && !this.isMapEventOK(event)){
        event = this.randomEvents(events);
    }
    if(!event)
        return false;
    let eventInfo = Game_Database.getData('event_map',event.index);
    if(eventInfo){
        if(this._event) {
            this._stashedEvent.push(this._event);
        }
        this._event = new Event_Cache(eventInfo);
        this._game.hp -= eventInfo.cost;
        this._infoChange['hp'] = true;
        if(callback)
            this._event.callback = callback;
        return true;
    }else
        return false;
};

GameManager.endMapEvent = function(){
    if(this.isChallenge() && this._event.getValue('exit')){
        this._stashedEvent.push(this._event);
        let eventInfo = Game_Database.getData('event_map',this._event.getValue('exit'));
        this._event = new Event_Cache(eventInfo);

    }else{
        this._stashedEvent.push(this._event);
        let eventInfo = Game_Database.getData('event_map',5);
        this._event = new Event_Cache(eventInfo);
    }
};

GameManager.winMapEvent = function(){
    if(this.isChallenge()){
        this._stashedEvent.push(this._event);
        let eventId = this.getChallengeEvent();
        let eventInfo = Game_Database.getData('event_map',eventId);
        this._event = new Event_Cache(eventInfo);
    }else{
        this._stashedEvent.push(this._event);
        let map = Game_Database.getData('map',this._game.map);
        let mapInfo = Game_Database.getData('mapinfo',map.info);
        let eventInfo = Game_Database.getData('event_map',mapInfo.win);
        this._event = new Event_Cache(eventInfo);
    }
};

GameManager.failMapEvent = function(){
    if(this.isChallenge() && this._event.getValue('fail')){
        this._stashedEvent.push(this._event);
        let fail = this._event.getValue('fail') || 13;
        let eventInfo = Game_Database.getData('event_map',fail);
        this._event = new Event_Cache(eventInfo);

    }else{
        this._stashedEvent.push(this._event);
        let eventInfo = Game_Database.getData('event_map',13);
        this._event = new Event_Cache(eventInfo);
    }
};

GameManager.showAlertSign = function(text){
    this._alert = text;
    this._alertChanged = true;
};

GameManager.updateNewStatus = function(){
    this._playerUpdated = false;
    for(let attr in this._infoChange){
        if(this._infoChange[attr])
            this._playerUpdated = true;
        this._infoChange[attr] = false;
    }
    this._backpackUpdated = this._backPackChange;
    this._backPackChange = null;

    this._eventUpdated = this._eventChanged;
    this._mapUpdated = this._mapChanged;

    this._mapChanged = false;
    this._eventChanged = false;
};

GameManager.update = function(){
    if(this._gameStarted){
        this.updateNewStatus();
        this.updateAutoEvents();
        if(TalkManager)
            TalkManager.update();
    }
};
