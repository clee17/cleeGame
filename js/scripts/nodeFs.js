fs.appendFileSync(dir+'\\'+key+'.idx',new Buffer(JSON.stringify(this._dataPack[key])));
fs.appendFile(path,contents,function(err,result){

});

let deleteFiles = function(){
    fs.readdir(testDir, (err, files) => {
        if (err) throw err;
        let length = files.length;
        let startIndex = 0;
        if(length==0)
        {
            reWrite();
            return;
        }

        files.forEach(function(file,index){
            fs.unlink(path.join(testDir, file), err => {
                if (err) throw err;
                else{
                    startIndex ++;
                    if(startIndex == length)
                        reWrite();
                }
            });
        })
    });
};