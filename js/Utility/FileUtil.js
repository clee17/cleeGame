var fs = require('fs');


var fileUtil = {
    checkFileUnderDir:(function()
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
    })()
};

module.exports = fileUtil;

