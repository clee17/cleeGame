var fs = require('fs');


var fileSystem = {
    walkWithFile:(function()
    {
        'use strict';
        return function checkDir(rootDir,fileName){
            let resultDir = [];
            fs.readdirSync(rootDir).forEach(function(fileResult){
                if(fileResult == fileName) {
                    resultDir.push(rootDir + '/'+fileResult);
                }
                else {
                    var path = rootDir+'/'+fileResult;
                    var stat = fs.statSync(path);
                    if (stat && stat.isDirectory()) {
                        resultDir = resultDir.concat(checkDir(path,fileName));
                    }
                }
            });
            return resultDir;
        };
    })(),

    sum:(function(){
        'use strict';
        return function fun(num){
            if(num<=1){
                return 1;
            }
            else{
                return num+fun(num-1);
            }
        }
    })()
};

module.exports = fileSystem;

