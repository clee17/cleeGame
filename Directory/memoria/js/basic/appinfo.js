function appinfo(){
    throw new Error('this is a static class');
}

appinfo._fontFamily = {'default':"Times New Roman"};

appinfo._gameVersion = "1.0.0";

appinfo._title = 'memoria';

appinfo._roleId = 0;

appinfo._screenWidth = 1280;

appinfo._screenHeight = 720;

appinfo.isNwjs = function(){
    return typeof require == 'function' && typeof process == 'object';
};

appinfo.isMobileDevice = function(){
    var r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return !!navigator.userAgent.match(r);
};

appinfo.isMobileSafari = function() {
    var agent = navigator.userAgent;
    return !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) &&
        !agent.match('CriOS'));
};

appinfo.isAndroidChrome = function() {
    var agent = navigator.userAgent;
    return !!(agent.match(/Android/) && agent.match(/Chrome/));
};

appinfo.canReadGameFiles = function() {
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

appinfo._id = 1;

appinfo.generateRuntimeId = function(){
    return Utils._id++;
};

appinfo.isOptionValid = function (name) {
    return location.search.slice(1).split('&').contains(name);
};

appinfo.GameFont = function(index){
    if(index != null)
        return this._fontFamily[index];
    else
        return this._fontFamily['default'];
};