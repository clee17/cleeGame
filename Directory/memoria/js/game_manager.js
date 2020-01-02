
/*注意，这里有引进一个storage manager的概念， 类似于正常游戏中的缓存机制;
* 在此机制存在的情况下，所有的游戏数据都先存在storage manager中，而后进入数据库；
* 但感觉会很吃内存。
 */

var data_manager = function(){
    throw new Error('This is a static class');
};

/*  Database  数据库表
*
*
* */
var $dataScript = null;  //人物对话表；
var $dataDialog = null;  //对话信息表
var $dataEvents = null;  //事件表；
var $dataMap = null;  //地图设置表；
var $dataRole = null;   //角色表
var $dataItems = null;  //物品表
var $dataItemEffect = null; //物品使用效果表；


/*游戏存档 结构设计
* 缩略图，datauri格式，直接存在数据里；
* 最新存档id;
* 自动存档；
* 进游戏先确认是否存在存档，如果否则创建新游戏；
* */
var $gameTemp;
var $gameEvents;
var $gameMap;
var $gameTimer;
var $gameProgress;
var $gameBackPack;
var $gameSave;

data_manager._databaseFiles = [
    {  name: '$dataScript',  src: 'data/script' },
    {  name: '$dataDialog',  src: 'data/dialog'  },
    {  name: '$dataMap',     src: 'data/map'    },
    {  name: '$dataEvents',  src: 'data/event'  },
    {  name: '$dataRole',    src: 'data/role'   },
    {  name: '$dataItems',   src: 'data/item'  },
    {  name: '$dataItemEffect',   src: 'data/itemEffect'  },
];

data_manager.loadDataBase = function(){
    console.log('start database loading');
    for(var i=0; i< this._databaseFiles.length;++i){
        var prefix = '/'+ appinfo._title+'/';
        var name = this._databaseFiles[i].name;
        var src = this._databaseFiles[i].src;
        this.loadDataFile(name,prefix+src);
    }
};

data_manager.loadDataFile = function(name, src){
    var xhr = new XMLHttpRequest();
    var url = src;
    xhr.open('GET',url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function(){
        if(xhr.status<400){
            let data = xhr.response;
            data = Base64.decode(data);
            window[name] = JSON.parse(data);
            data_manager.onLoad(window[name]);
        }
    };
    xhr.onerror = function(){
        data_manager._errorUrl = 'could not load the database file:'+url;
    };
    window[name] = null;
    xhr.send();
};

//解析从后端返回的数据；
data_manager.onLoad = function(object){

};

data_manager.isDatabaseLoaded = function(){
    for(var i=0; i<this._databaseFiles.length; i++){
        if(!window[this._databaseFiles[i].name]){
            return false;
        }
    }
    return true;
};

data_manager.createGameObjects = function(){
    // $gameTemp = new Game_Temp();
    // $gameEvents = new Game_Event();
    // $gameMap = new Game_Map();
    // $gameTimer = new Game_Timer();
    // $gameProgress = new Game_Progress();
    // $gameBackPack = new Game_BackPack();
    // $gameSave = new Game_Save();
};

data_manager.setupNewGame = function(){
    this.createGameObjects();
    this.loadSaveFile();
    // $gameEvents.initialize();
    // $gameMap.initialize();
    // $gameBackPack.init);
};

data_manager.saveGame = function(){

};

data_manager.loadGame = function(savefileId){

};

data_manager.loadSaveFile = function(){
    var xhr = new XMLHttpRequest();
    var url = '/'+ this._title+'/save/'+ appInfo._roleId;
    xhr.open('GET',url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function(){
        if(xhr.status<400){
            window['save'] = JSON.parse(xhr.responseText);
            data_manager.onLoad(window['save']);
        }
    };
    xhr.onerror = function(){
        data_manager._errorUrl = 'could not load the database file:'+url;
    };
    window[name] = null;
    xhr.send();
};

/*
*  ConfigManager
*
* */

var config_manager = function(){
    throw new Error('This is a static class');
};


/*    manager_texture
*
*
*
* */

var texture_manager = function(){
    throw new Error('This is a static class');
};


texture_manager._loading = false;

texture_manager._textures = [];


/*
*
* Image Manager
*
 */

function ImageManager(){
    throw new Error('This is a static class');
}

ImageManager.cache = new CacheMap(ImageManager);

/* scene_manager
*
*
*
* */


var scene_manager = function(){
    throw new Error('This is a static class');
};

scene_manager._scene        = null;
scene_manager._nextScene    = null;
scene_manager._stack        = [];
scene_manager._stopped      = false;
scene_manager._sceneStarted = false;
scene_manager._exiting      = false;
scene_manager._previousClass= null;


scene_manager.run = function(){


};

console.log('finished loading manager');