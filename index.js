var express = require('express');
var wechat = require('wechat');
var http = require('http');
var qs = require('querystring');
var { wechatCheckToken } = require('./utils');
var app = express();
var config = {
    token: 'wechat',
    appid: 'wxe81288f5ea1062fa',
    encodingAESKey: 'Cfs9jJ8ZdhOa9Jm351yF5FW1RbQZ30g57tfVfPgvibS',
    checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};
var post_data = { //添加图文素材的参数
    "articles": [{
            "title": '人工服务咨询',
            "thumb_media_id": '5ulhwvfpJrD_Xdln-f98lDxfL7GY7dGzHbfNYJH5YY8rKs3l8-4CvT9vNeO2PBjU',
            "author": '',
            "digest": ' ',
            "show_cover_pic": 0,
            "content": '<p>您好！欢迎联系懒猪到家在线技术支持，请选择您需要咨询的内容，并回复对应的数字序号：</p><p>[1] 订单问题</p><p>[2] 商家问题</p><p>[3] 投诉建议</p><p>[4] 商务合作</p><p>例如：咨询订单问题的相关内容，请回复 1，将由在线客服为您咨询</p>',
            "content_source_url": 'http://www.pigcome.com/wechat'
        },
        //若新增的是多图文素材，则此处应还有几段articles结构
    ]
};
var post_data1 = { //获取素材列表参数
    "type": "image",
    "offset": 0,
    "count": 10
};
var content = qs.stringify(post_data1);
var options = {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=13_AgMxra-Yp5-En7Q4WB_ds-gQE4siISKdggQAjxDbrwlsSTQ_oe-4vTnXvCA5F17r4ZGR5hpOeHbFQFhuUA_CvTMex0O_81htvWtNYZ6IyzXC_dokVJrMKUeJxmYCtH13ct-zs-aDhNCmXIVKVYHiAHAEHQ',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
}
var req = http.request(options, function(res) {
    console.log(res.content);
    console.log('STATUS:' + res.statusCode);
    console.log('HEADERS:' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
        console.log('BODY' + chunk);
    });
});
req.on('error', function(e) {
    console.log('错误信息' + e.message);
});
req.write(content);
req.end();
// 验证服务器配置方法，成功后不再使用
app.use(wechatCheckToken);

// 参数处理
app.use(express.query());

// 在服务器验证完成后该公众号就进入了开发模式，在开发模式下所有的消息都会被转发到这个服务器上。所以需要在服务器上将消息转发到多客服系统
app.use('/wechat', wechat(config, function(req, res, next) {
    console.log('mssage==> %o', req.weixin);
    res.transfer2CustomerService();
}));

app.listen(8084, '0.0.0.0', function(err) {
    if (!err) console.log('启动');
});