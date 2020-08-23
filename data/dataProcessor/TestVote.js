global = require('../../Server/routes/global');

let fs = require('fs'),
    path = require('path'),
    LZString = require('../../js/lib/lz-string1.4.4');

let voteModel = require('./../model/cleeArchive_vote');

let addVote = function() {
    let newVote = new voteModel;
    let title = {};
    title.en = "jaydick week(bottomjay only) date poll";
    title.cn = "jaydick周(桶受限定)日期投票'}";

    let description = {};
    description.en = "This poll is hold for deciding the date of bottom jason event which focuses on jaydick ship";
    description.cn = "该投票旨在决定即将举办的dickjay活动周的具体举办日期";

}





