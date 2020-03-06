let express = require('express'),
    path = require('path'),
    lzString = require(path.join(__basedir, 'js/lib/lz-string1.4.4'));

let countMapModel = require(path.join(__dataModel,'cleeArchive_countMap'));


var router = express.Router();

var handler = {
    finalSend:function(res,data){
        if(data.sent)
            return;
        data.sent = true;
        res.send(lzString.compressToBase64(JSON.stringify(data)));
    },

    all:function(req,res){
        let index = [0,5,100,101,102];
        let data = {
            sent:false,
            success:false,
            error:null,
            message:''
        };
        countMapModel.find({infoType:{$in:index}},function(err,docs){
            if(err)
                data.error = err;
            else
                data.result = JSON.parse(JSON.stringify(docs));
            if(!data.error)
                data.success = true;
            handler.finalSend(res,data);
        });
    }
};

router.post('/all',handler.all);

module.exports=router;