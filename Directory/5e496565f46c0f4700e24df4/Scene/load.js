let cover = viewport.getCover();
let div = document.createElement('div');
div.style.position = 'absolute';
div.id = 'anim';
div.style.left = '5px';
div.style.bottom = '0px';
div.style.display = "flex";
div.style.flexDirection = "row";
div.innerHTML =  '<img style="transform:translate(20px,-40px);" src="/svg/flyingbat.svg#bat" alt="">' +
    '<img style="transform:translateX(-60px,20px);" src="/svg/jasonshouseloader.svg#rootJason" alt="Jason is coming">';
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
{
    bar.style.background = 'red';
    bar.style.bottom = '20px';
}

let info = cover.getElementById('info');
info.innerHTML = '';

let oldUpdate = cover.updateChildren;
cover.updateChildren = function(){
    oldUpdate.bind(this);
    let resourceProgress = 0;
    let scriptProgress = 0;
    let bootProgress = 0;
    if (window['loader'])
        resourceProgress = window['loader'].getProgress();
    if (window['scriptManager'])
        scriptProgress = window['scriptManager'].getProgress();
    if( window['Game_Boot'])
        bootProgress = window['Game_Boot'].getProgress();
    let finalProgress =  resourceProgress / 100 *40 + scriptProgress / 100 * 30 +bootProgress/100*30;
    div.style.transform = 'translateX('+Math.floor(finalProgress/100*viewport.width-200)+'px)';
};
