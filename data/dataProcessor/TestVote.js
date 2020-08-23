

let fs = require('fs'),
    path = require('path'),
    LZString = require('../../js/lib/lz-string1.4.4');

let voteModel = require('./../model/cleeArchive_vote');
let global = require('./../../Server/global.js');

let addVote = function() {
    let newVote = new voteModel;
    let title = {};
    title.en = "Jaydick week(bottomjay only) date poll";
    title.cn = "Jaydick周(桶受限定)日期投票";

    let description = {};
    description.en = "This poll is hold for deciding the date of bottom jason event which focuses on jaydick ship";
    description.cn = "该投票旨在决定即将举办的dickjay活动周的具体举办日期";

    newVote.title = global.__packMultiLang(title);
    newVote.description = global.__packMultiLang(description);

    let timeNow = Date.now();
    let timeEnd = timeNow +14*24*60*60*1000;
    newVote.start = timeNow;
    newVote.end = timeEnd;

    newVote.save(function(err,doc){
        if(err)
            console.log(err);
        else
           console.log(doc);
    });
};


addVote();


