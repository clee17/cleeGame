let cover = viewport.getCover();
let div = document.createElement('div');
div.style.position = 'absolute';
div.id = 'anim';
div.style.left = '5px';
div.style.bottom = '25px';
div.innerHTML =  '<svg style="transform:translate(-60px,90px);"><use xlink:href="/svg/flyingbat.svg#bat"></use></svg>' +
    '<svg style="transform:translateX(0px);"><use xlink:href="/svg/jasonshouseloader.svg#rootJason"></use></svg>';
cover.appendChild(div);
let date = new Date(Date.now());
let hour = date.getHours();
if((hour >=19 && hour< 24) || (hour <5))
    cover.setStyle('background', 'linear-gradient(to bottom, #3b3b54 0%, #616572 100%)');
else if(hour >= 8 && hour < 18)
    cover.setStyle('background', 'linear-gradient(to bottom, #2d77be 0%, #abd2dc 100%)');
else if((hour >=18 && hour <19) || (hour >=5 && hour <8))
   cover.setStyle('background','linear-gradient(to bottom, #a3182b 0%, #fdc971 100%)');
let bar = cover.getElementById('bar');
if(bar)
   bar.style.background = 'red';
let info = cover.getElementById('info');
info.innerHTML = '';


let oldUpdate = cover.updateChildren;
cover.updateChildren = function(){
    oldUpdate.bind(this);
    if(window['loader'])
    {
        let resourceProgress = 0;
        let scriptProgress = 0;
        if (window['loader'])
            resourceProgress = window['loader'].getProgress();
        if (window['scriptManager'])
            scriptProgress = window['scriptManager'].getProgress();
        let finalProgress =  resourceProgress / 100 * 70 + scriptProgress / 100 * 30;
        div.style.transform = 'translateX('+Math.floor(finalProgress/100*viewport.width-60)+'px)';
    }

};
