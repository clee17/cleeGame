
let readTest = function(){
    fs.readFile(path.join(testDir,'Encrypt0.clg'),(err,file)=>{
        if(file)
        {
            let buffer = file.slice(0,3130);
            fs.writeFile(path.join(testDir,'test.png'),buffer,(err)=>{
                if(err)
                    console.log(err);
                else
                    console.log('savesuccess');
            })
        }
    });
};

let toArrayBuffer = function(buffer)
{
    var newBuffer = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(newBuffer);
    for(var j=0;j<buffer.length;++j)
    {
        view[j] = buffer[j];
    }
    return newBuffer;
};

let sliceTest = function(){
    fs.readFile(path.join(testDir,'Encrypt0.clg'),(err,file)=>{
        if(file)
        {
            let firstBuffer = file.slice(0,1000);
            let secondBuffer = file.slice(1000,3130);
            let ab = new ArrayBuffer(3130);
            let dataView = new DataView(ab);
            for(var i =0; i< 3130;++i)
            {
                if(i<firstBuffer.length)
                    dataView.setUint8(i,firstBuffer[i]);
                else
                    dataView.setUint8(i,secondBuffer[i-firstBuffer.length]);
            }
            fs.writeFile(path.join(testDir,'test.png'),new Buffer.from(ab),(err)=>{
                if(err)
                    console.log(err);
                else
                    console.log('savesuccess');
            })
        }
    });
};

let bytesTest = function(){
    var num = 200;
    var num1 = 182;
    var num3 = 55;
    let arrayBuffer = new ArrayBuffer(3);
    let view = new Uint8Array(arrayBuffer);
    view[0] = parseInt('0x52',16);
    view[1] = parseInt(num.toString(16),16);
    view[2] = parseInt(num1.toString(16),16);

    for(let i=0;i<arrayBuffer.byteLength;++i)
    {
        view[i] = view[i]^parseInt(num3.toString(16),16);
    }

    for(let i=0;i<arrayBuffer.byteLength;++i)
    {
        view[i] = view[i]^parseInt(num3.toString(16),16);
    }

};

let reWrite = function(){
    fs.readdir(gameDir, (err, files) => {
        let fileSizeCount = 0;
        let fileCount = 0;
        reference.maxFiles = files.length;
        files.forEach(function(item,index){
            fs.readFile(path.join(gameDir,item),(err,file)=>{
                let obj = {};
                obj.startIndex = fileSizeCount %100000;
                obj.fileId = parseInt(fileSizeCount/100000);
                obj.fileSize = file.length;
                let totalLength = file.length;
                let startIndex = 0;
                while(totalLength>0)
                {
                    console.log("==================================");
                    let step = 100000- fileSizeCount %100000;
                    let fileId = parseInt(fileSizeCount/100000);
                    let sliceLength = totalLength;
                    if(sliceLength>step)
                        sliceLength = step;
                    console.log('currentFileSizeCount:'+fileSizeCount);
                    console.log('currentFileLeftLength:'+totalLength);
                    console.log('currentFileId'+fileId);
                    console.log('currentChunkToAppend'+sliceLength);
                    console.log(file.slice(startIndex,startIndex+sliceLength));
                    fs.appendFileSync(testDir+'/Encrypt'+fileId+'.clg',file.slice(startIndex,startIndex+sliceLength));
                    fileSizeCount+= sliceLength;
                    totalLength -= sliceLength;
                    startIndex+= sliceLength;
                    console.log("===============================");
                }
                reference.index[item]= obj;
                fileCount++;
                if(fileCount === files.length)
                {
                    fs.writeFile(path.join(testDir,'index.json'),JSON.stringify(reference,null,'\t'),(err)=>{
                        console.log(err);
                        if(!err)
                            console.log('write success');
                    });
                }
            });
        });

    });
};