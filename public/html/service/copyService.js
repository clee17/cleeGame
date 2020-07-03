var copyText = function(text)
{
    var tag = document.createElement('input');
    tag.setAttribute('id', 'cp_hgz_input');
    tag.value = text;
    document.getElementsByTagName('body')[0].appendChild(tag);
    document.getElementById('cp_hgz_input').select();
    document.execCommand('copy');
    document.getElementById('cp_hgz_input').remove();
}

var copyPrev = function(target){
    if(target.parentNode)
        target = target.parentNode;
    let prevSibling = target.previousElementSibling;
    let text = prevSibling? prevSibling.innerText: '';
    copyText(text);
}