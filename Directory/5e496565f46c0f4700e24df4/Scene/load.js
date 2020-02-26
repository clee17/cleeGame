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
    bar.style.width  = '1px';
}

let info = cover.getElementById('info');
info.innerHTML = '';

cover.updateChildren = function(){
    let finalProgress = this.getProgress();
    div.style.transform = 'translateX('+Math.floor(finalProgress/100*viewport.width-200)+'px)';
};
