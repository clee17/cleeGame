var text = [
    "THANK YOU FOR YOUR SUPPORT",
    "We accept any amount of donation ranging from $1 to $100",
    "Details of Expense",
    " <p>You may refer below for the details of how your donation is spent：</p>\n" +
    "        <ul>" +
    "            <li><b>rent of server：</b>This site rented ECS provided by AWS, it is charged according to the monthly use of storage，currently the monthly pay for the server is at around <b>$12</b>;</li>" +
    "            <li><b>rent of network flow：</b>So far I am not so sure about how AWS has charged me on this, but it looks like I haven't reached their free limit yet。</li>" +
    "            <li><b>rent of domain name：</b>We purchased domain from AWS Route 53. The annual cost is at around <b>$20</b>.</li>" +
    "            <li><b>cost of legal service：</b>Sometimes we might need to consult with the legal team for details of how we manage the website, the cost could vary from <b>$2000 to $2500 </b>annually, we will let you know if it goes beyond that.</li>" +
    "            <li><b>cost of mail service：</b>We plan to use enterprise email system to deliver messages to our users, so we might need <b>$150</b> annually for the service.</li>" +
    "            <li><b>Others：</b>Sometimes we pay professional UI designers and developers to do the job when volunteers are not capable of completing certain task, we will let you know about the details.</li>" +
    "        </ul>" +
    "        <p>All donators own the right to have detailed knowledge of how their money are spent, I am currently working on a monthly finance report system, you may click the '<b style='color:rgba(158,142,166,255);text-decoration:underline;'> 【NEED REPORT】 </b>' button on the bottom of this page should you need that, you should be able to receive an email stating the details of all costs once the system is officially onlien。</p>\n" +
    "        <p>We only accept donations from registered users so far.</p>",
    "Methods of Donation",
    " <p>We commit that we shall never divulge your personal information，please kindly leave us a nickname so that we could give you thanks in public.</p>",
    "        <p>For the users from China, you may transfer to the following Aplipay or wechat account, with a comment for your username on the website:</p>",
    "For overseas users, you may transfer to the following paypal account:",
    "The information is waiting to be updated.",
    "<div>Do you wish to reset <%- user %>'s password？</div>",

    "<h1>The mail address has been taken!</h1>"+
    "<p>This mail address has an application connected now，please check the current status of that with the application ID <%- code %>. </p>",

    "<h1>ACCOUNT REQUEST SUCCESS！</h1>" +
    "<p>Your mail and statements has been successfully submitted for review. You may receive a mail including a link for registration after the request is accepted。</p>" +
    "<p>You could also check the current status of your request here <a href=\"/registerProcess\">GO</a></p>" +
    "<p>Administrators review the queue every night so please kindly come back after 24 to 48 hours.</p>" +
    "<p>Enjoy!</p>",

    "<h1>There is an account connected to this mail！</h1>"+
    "<p>There is an account connected to this mail already, please login. Or you may <b> <a href='/resetPwdRequest'>reset your password</a></b>.</p>",

    "<p>This site is created to provide a place where artists could keep their works more privately and share the experience when creating them. </p>" +
    "<p>There are various forms of fan arts now days, fan artists are no longer satisfied by simply writing and drawing, they could express their love by  。</p>" +
    "<p>You could choose to become one or more of the following roles here : <b>fan fiction writers、fan game designers、fan arts painters</b>，and publish or keep them private to yourself, we do sincerely welcome you here. Please contact administrator if you have any other good ideas in mind.</p>" +
    "<p>Enjoy!</p>",

    "<p>This site's server is located in Japan, where the culture of 'doujin' has been existing for a long time. </p>" +
    "<p>As we choose to apply the Japanese law to this site in general, please carefully grade your post no matter what you are posting.</p>" +
    "<p>Also, as we decide to respect visitors from various background,<b>you might not be able to browse or publish some of the posts. However, you may still choose to archive your works here and they will be kept and protected by us</b>.</p>" +
    "<p>We commit that we will do whatever we can to protect your works as long as this site is online.</p>"+
    "<p>There are some contents that this site would reject to accept as stated in <a href='/countryStatement' target='_blank'>service statement</a>.</p>",

    "<p>You could help us through donation. </p>" +
    "<p>You may specifically specifies to which form of fan arts you would donate , thus to purchase resource for the mentioned form of arts. Or you could skip this part and let the developers decide which one needs the most.</p>" +
    "<p>We listed below the form of fan arts we support now, which is to be updated constantly. The colored ones indicates that they are available now.</p>",

    "<p>You could <b>login at the top right corner</b> if you own an account already.</p>" +
    "<p>Even without an account, you could still read the posts that are published and suited to the policy and laws of your location, however you could only post your work with an account.</p>" +
    "<p>You may check <a href=\"/registerProcess\">here</a> for the progress of your registration as all applications will have to be reviewed by administrators.</p>",

    "&nbsp&nbsp&nbsp&nbspYou've requested an account with this mail address before,please do not resubmit it, you may check the current status of your application <a href=\"/registerProcess\">here</a>.</span>",

    '<p>We we do not accept donation from non-users so far, you need at least send an application below before you could review the information for donation.</p>'+
    '<p>It is not a must nor will it help the process of your application.</p>'+
    '<p>You may enter the page of donation under your username when you are logged in.</p>'+
    '<p>Enjoy the site!</p>',

    '<h1><span>Fan fiction writer\'s tool</span></h1>' +
    '<p>This tool is completed and will provided to users now.</p>'+
    '<p>You may gain this role as soon as you complete a registration of our site. </p>',

    '<h1> <span>Fan arts painter</span></h1>' +
    '<p>This tool is still under development, you may reply to thread with your idea on our news\' board about this tool <a href="/news">here</a>.</p>' +
    '<p>We will try our best to read and consider every suggestion that is sent to us. </p>' +
    '<p>Enjoy!</p>',
];

module.exports = text;