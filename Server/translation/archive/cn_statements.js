var text = [
    "感谢您对本站的支持",

    "捐赠在于心意不在于数额，不管是5角、1元还是100元、500元本站都接受，<b>但同年度内本站不接受累积500元以上的捐赠</b>，如果有来自同一个人累积超过500元以上数额的，款项将原路退回。",

    "款项的去向",

    " <p>款项的主要费用去向罗列如下：</p>" +
    "        <ul>" +
    "            <li><b>空间的租赁费用：</b>本站使用的是AWS的ECS空间，它采用弹性计价的方式，根据使用空间的大小按月收取费用，目前网站的月空间费用约为$12(约人民币89元)</li>" +
    "            <li><b>网络服务的租赁费用：</b>AWS的计价费用是按照小时计算，每个月有一定的免费额度，目前本站的流量使用尚未超出免费额度。</li>" +
    "            <li><b>域名费用：</b>本站购买的是AWS的Route53域名服务，一年的费用约为$20 (约人民币140元)左右。</li>" +
    "            <li><b>法律服务：</b>有时候我们需要专业的法律咨询业务以让网站正常的运营，这样的开销一年大约在2W人民币左右，如果超出该数字，我们会尽量让你们得知.</li>" +
    "            <li><b>邮箱服务：</b>因为我们利用邮箱向我们的用户发送细则邮件，因此我们计划将要购买企业邮箱服务，一年大约1000元左右.</li>" +
    "            <li><b>其他费用：</b>在本站的计划中有不同的创作形式，其中一些图片、游戏等开发形式需要来自志愿者与站主以外的开发支持，如UI设计、网站优化等。</li>" +
    "        </ul>" +
    "        <p>任何捐赠人都有权利了解当前网站的资金储备情况与支出的明细，开发者正在开发自动分发账单的系统，如果有需要您可以在页面最下方点击申请账单链接，系统开发完成后您将按月自动收达支出与资金储备明细。</p>" +
    "        <p>本站暂时只接受注册用户的捐赠。</p>",

    "捐赠方式",

    " <p>本站承诺绝不透露您的真实个人信息，但希望您可以留下您在站内的用户名，或者可以对外公布的昵称，以便我们表示感谢。</p>", //5

    "        <p>中国地区的用户，可以备注您的注册邮箱和指定的创作形式到支付宝或微信账户：</p>",

    "海外地区的用户，可以捐赠到paypal账户中:",

    "      paypal账户信息等待更新中。",

    "<div>您是否要重设<%- user %>的密码？</div>", //9

    "<h1>该邮箱已被注册!</h1>"+
    "<p>该邮箱已被注册，请前往<a href='/registerProcess' target='_blank'>申请进度查询</a>并使用申请码<b> <%- code %></b>来查询您的申请进度 </p>", //10

    "<h1>申请注册成功！</h1>" +
    "<p>您的邮箱与陈述已经成功被递交到审核队列中，审理通过后您将收到一封包含有注册链接邮件，届时请通过链接完成注册。</p>" +
    "<p>您也可以通过网站的审核查询界面使用邮箱查询审核进度<a href=\"/registerProcess\">前往</a></p>" +
    "<p>管理员每天晚上检查一次申请队列，因此您可以第二天早上确认您的申请状态</p>" +
    "<p>祝创作愉快</p>",

    "<h1>该邮箱已存在关联账号！</h1>"+
    "<p>本站已有一个帐号与该邮箱关联，请点击右上角直接登录，如有必要，请<a href='/resetPwdRequest'>重设密码</a>.</p>",

    "<p>本站的创建之初原本只是作为创站者个人在开发过程中使用的资料、剧本、技术文章归档网站。 </p>" +
    "<p>在开发过程中，创站者逐渐意识到有那么多种才华横溢的同人作者活跃在世界各地，却因为同人这种特殊的表达形式而无法尽情地表达自己，因此站长决定将本站面向社会开放，力图为各种各样的同人开发者提供一个表现自己与交流的平台。</p>" +
    "<p>在这里您可以选择成为<b>同人文章创作者、同人游戏设计师、同人绘师</b>等等，获取来自世界各地阅览者的评价，发布自己的作品（不管您发布的是<b>游戏、音乐、绘图还是文字</b>）,本站都是非常欢迎的，如果您有提交任何其他作品形式的需求，也请欢迎联系站主。</p>" +
    "<p>让我们开始创作。</p>",

    "<p>本站的服务器地点位于日本——在这儿同人创作有着悠久的历史。 </p>" +
    "<p>本站选择适用日本的法律，这意味着您必须准确地为您的作品标注分级。</p>" +
    "<p>与此同时，本站会针对世界各地的法律进行浏览内容的调整，<b>因为您所在国家、地区的法律政策原因，您可能无法浏览、发布部分内容，但您所上传的一切内容仍然将被保存服务器上。</b></p>" +
    "<p>本站承诺在服务器存续期间将最大限度地保护您的作品。</p>"+
    "<p>本站拒绝接受恐怖反动、色情、政治相关联的投稿，具体细则请参阅<a href='/countryStatement' target='_blank'>服务声明</a>。</p>",

    "<p>您可以通过捐赠的方式来帮助本站的发展。 </p>" +
    "<p>您可以指定您投资的作品形式：如，文章、绘图、游戏等等，也可以在不指定的情况下交由站长分配给不同形式的开发进程。</p>" +
    "<p>下方罗列了我们所有的创作形式，灰色表示尚在开发中，创作形式会持续更新</p>",

    "<p>如果您已经拥有本站的账号，可以<b>点击右上角直接登录。</b> </p>" +
    "<p>即使没有本站账号，您也可以浏览符合您国家与地区政策法规的内容，但只有拥有账号后才能发布作品。</p>" +
    "<p>您可以在<a href=\"/registerProcess\">这里</a>查询您的注册审核进度</p>",

    "&nbsp&nbsp&nbsp&nbsp您已用该邮箱完成过申请，请勿重复申请，申请需要经过管理员的审核，您可以前往<a href=\"/registerProcess\">审核</a>页面确认审核进度。</span>"
];

module.exports = text;