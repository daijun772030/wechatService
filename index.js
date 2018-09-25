var express = require('express');
var wechat = require('wechat');
var { wechatCheckToken } = require('./utils');
var app = express();
var config = {
    token: 'wechat',
    appid: 'wxe81288f5ea1062fa',
    encodingAESKey: 'Cfs9jJ8ZdhOa9Jm351yF5FW1RbQZ30g57tfVfPgvibS',
    checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};

var access = {
    token: '14_ve2GhWUBx6nb2yktpU94xI3uwVvDdwGGOkeY_xIe0pMxETELwcxHyM5iZVHJiM_xSNCSoW6UqHbKRZh7erFrTS3jxETj6QnTimIsZQXffaKYyMxtk2Cn5nMGi3zvs2ybgXTfAEOpafKgsb7aKQZcADABHQ',
    secret: '7ea2af72f3d88346bc12c17d7bd6f81d'
}


// 验证服务器配置方法，成功后不再使用
app.use(wechatCheckToken);

// 参数处理
app.use(express.query());

// 在服务器验证完成后该公众号就进入了开发模式，在开发模式下所有的消息都会被转发到这个服务器上。所以需要在服务器上将消息转发到多客服系统
app.use('/wechat', wechat(config, function(req, res, next) {
    console.log('message==> %o', req.weixin);
    // 确定点击的自定义菜单是客服服务按钮，然后就自动回复响应的内容，否则就转发到多客服系统
    if (req.weixin.Event === 'CLICK' && req.weixin.EventKey === 'CUSTOMER_SERVICE') {
        res.reply(`您好！欢迎联系懒猪到家在线技术支持，请选择您需要咨询的内容，并回复对应的数字序号：\n[1] 订单问题 \n[2] 商家问题 \n[3] 投诉建议 \n[4] 商务合作 \n例如：咨询订单问题的相关内容，请回复 1，将由在线客服为您咨询`);
    } else {
        switch(req.weixin.Content) {
            case '1': 
                res.reply('订单问题');
                break;
            case '2': 
                res.reply('商家问题');
                break;
            case '3': 
                res.reply('投诉建议');
                break;
            case '4': 
                res.reply('商务合作');
                break;
            default: res.transfer2CustomerService();
        }
    }
}));

app.listen(8084, '0.0.0.0', function(err) {
    if (!err) console.log('启动');
});