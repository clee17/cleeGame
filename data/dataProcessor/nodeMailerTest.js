var nodeMailer=require('nodemailer');


var mailTransport = nodeMailer.createTransport({
    host : 'localhost',
    port : 25,
    tls:{
	rejectUnauthorized:false
	}
});

    var options = {
        from        : '"cleeArchive admin" <no-replay@archive.cleegame.com>',
        to          : ' <christina.lee.cn@outlook.com>',
        subject        :'感谢使用cleeArchive',
        html           : '<p>This is a test sent from nodemailer with SES.</p>',
    };

    mailTransport.sendMail(options,function(err,result){
        if(err)
           console.log(err);
        else
            console.log(result);
    });

