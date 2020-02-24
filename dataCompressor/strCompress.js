var path = require('path');

let root = path.join(path.resolve(__dirname));
var lzString = require(path.join(root, '../js/lib/lz-string1.4.4'));

function CompressAll(){
    let docs = fs.readDirSync(root);
    let content = '';
    for(let i=0;i<docs;++i){
        if(docs[i] !== 'strCompress.js' && docs[i] !== 'result.txt'){
            let result = fs.readFileSync(root+'/'+docs[i],{encoding:'utf-8'});
            if(result)
                content += lzString.compressToBase64(result);
        }
    }
    fs.writeFileSync('./result.txt',content,{encoding:'utf-8'});
    console.log('写入完成');
}