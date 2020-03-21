let fs = require('fs'),
    path = require('path');

const args = process.argv.slice(2);

if(typeof(args[0])!== 'string')
    return;

let rootDir = path.resolve(__dirname);
rootDir = path.join(rootDir,'../../Directory');
let gameDir = path.join(rootDir,args[0],'/img/titles');
let testDir = path.join(rootDir,args[0],'/img/clgTitles');

let reference = JSON.parse(fs.readFileSync(path.join(testDir,'index.json')));

let countFileNum = function(refer){
   let left = 100000-refer.startIndex;
   totalLength = refer.fileSize;
   totalLength-=left;
   let addCount = 0;
   if(totalLength >0)
   {
       addCount = Math.ceil(totalLength/100000);
   }
   return addCount+1;
};

let trimLength = function(currentStep)
{
    if(currentStep > 100000)
    {
        return 100000;
    }
    else
        return currentStep;
};

let readFile = function(fileName){
    if(!reference.index[fileName])
        return null;
    let refer = reference.index[fileName];
    let fileCount = countFileNum(refer);
    let bufferList = [];
    let buffer = fs.readFileSync(path.join(testDir,'Encrypt'+refer.fileId+'.clg'));
    let currentStep = refer.fileSize;
    if(currentStep>=(100000-refer.startIndex))
        currentStep = 100000-refer.startIndex;
    buffer = buffer.slice(refer.startIndex,refer.startIndex+currentStep);
    let finalLength = buffer.length;
    bufferList.push(buffer);
    let leftLength = refer.fileSize - currentStep;
    for(let i=1;i<fileCount;++i)
    {
        let id= refer.fileId+i;
        let newBuffer = fs.readFileSync(path.join(testDir,'Encrypt'+id+'.clg'));
        if(newBuffer) {
            currentStep = trimLength(leftLength);
            bufferList.push(newBuffer.slice(0,currentStep));
            finalLength += currentStep;
            leftLength -= currentStep;
        }
    }
    let finalBuffer = Buffer.concat(bufferList,finalLength);
    try{
        fs.writeFileSync(path.join(testDir,fileName),finalBuffer);
    }
    catch(er)
    {
        console.log(er);
    }
};

readFile('starrySky.png');