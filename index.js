var express = require('express');
var wechat = require('wechat');
var path = require('path');
var { wechatCheckToken, getAccessToken, uploadMedio, sendMessageBatch } = require('./utils');


var app = express();
var config = {
    token: 'wechat',
    appid: 'wxe81288f5ea1062fa',
    encodingAESKey: 'Cfs9jJ8ZdhOa9Jm351yF5FW1RbQZ30g57tfVfPgvibS',
    checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};

var access = {
    appid: 'wxe81288f5ea1062fa',
    secret: '7ea2af72f3d88346bc12c17d7bd6f81d',
    token: ''
}

var media = {
    prod1: '',
    prod2: ''
}

// 获取微信token
getAccessToken(access).then(res => {
    access.token = res.access_token;
    console.log('获取微信api的token成功！', res.access_token);
    
    // 测试上传素材
    uploadMedio(path.resolve(__dirname, './images/prod1.png'), 'image').then((res) => {
        console.log(res);
        media.prod1 = res.media_id;
        uploadMedio(path.resolve(__dirname, './images/prod2.png'), 'image').then((res) => {
            console.log(res);
            media.prod2 = res.media_id;
        }).catch(e => {
            console.log(e);
        });
    }).catch(e => {
        console.log(e);
    });
    
}).catch(e => console.log(e));


// 重定向到Android和ios下载地址
app.use('/wechat/download', function(req, res, next) {
    var ua =req.headers['user-agent'],  
    $ = {};  
  console.log(req.headers);
  console.log(/iPhone/.test(ua));
// 不是移动端直接跳转到android下载页面
if (!/mobile/i.test(ua)) res.redirect(301, 'https://www.wandoujia.com/apps/com.example.sjkj');
if(/iPhone/.test(ua)) res.redirect(301, 'https://itunes.apple.com/cn/app/%E6%87%92%E7%8C%AA%E5%88%B0%E5%AE%B6/id1435420262?mt=8');
  
if (/Android/.test(ua)) res.redirect(301, 'https://www.wandoujia.com/apps/com.example.sjkj');
});


// 验证服务器配置方法，成功后不再使用
app.use(wechatCheckToken);

// 参数处理
app.use(express.query());

// 创建一个MsgId的对象，用户排出同一个消息多次发送的问题，因为微信app会在发送消息后重复发送防止丢包
var MsgIds = {};

// 在服务器验证完成后该公众号就进入了开发模式，在开发模式下所有的消息都会被转发到这个服务器上。所以需要在服务器上将消息转发到多客服系统
app.use('/wechat', wechat(config, function(req, res, next) {
    console.log('message==> %o', req.weixin);
    // 检查当前这个信息id是已经发送过的，就不再发送了
    if(MsgIds[req.weixin.MsgId] && MsgIds[req.weixin.MsgId].isSend) {
        res.reply();
        return;
    }
    MsgIds[req.weixin.MsgId] = { ...req.weixin, isSend: false };
    // 确定点击的自定义菜单是客服服务按钮，然后就自动回复响应的内容，否则就转发到多客服系统
    if (req.weixin.Event === 'CLICK' && req.weixin.EventKey === 'CUSTOMER_SERVICE') {
        res.reply(`您好！欢迎联系懒猪到家在线技术支持，请选择您需要咨询的内容，并回复对应的数字序号：\n[1] 订单问题 \n[2] 商家问题 \n[3] 投诉建议 \n[4] 商务合作 \n例如：咨询订单问题的相关内容，请回复 1，将由在线客服为您咨询`);
    } else {
        switch (req.weixin.Content) {
            case '1':
                res.reply('直接输入订单问题，客服尽快为您解答');
                break;
            case '2':
                res.reply('直接输入商家问题，客服尽快为您解答');
                break;
            case '3':
                res.reply('直接输入对公司的建议，客服尽快为您处理');
                break;
            case '4':
                res.reply('直接输入关于商务合作的问题，客服尽快为您解答');
                break;
            case '懒猪锦鲤':
                // 批量发送消息，一条一条的发送，如果只发送一条使用sendMessage
                console.log('发送', media.prod1, media.prod2)
                sendMessageBatch([
                    {
                        type: 'text',
                        content: "懒猪锦鲤：幸运儿，完成下面两步，即可拥有我哦！\n1、转发下方“懒猪锦鲤”图到朋友圈；\n2、点击后方链接，完成商家入驻信息填写；<a href=\"http://www.pigcome.com:8085/Winning\">点此前往</a>",
                        openId: req.weixin.FromUserName
                    },
                    // 发送图片
                    {
                        type: 'image',
                        content: media.prod1,
                        openId: req.weixin.FromUserName
                    },
                    // {
                    //     type: 'image',
                    //     content: media.prod2,
                    //     openId: req.weixin.FromUserName
                    // }
                    // 图文消息，带链接的
                    // {
                    //     type: 'new',
                    //     content: [
                    //         {
                    //           "title":"Happy Day",
                    //           "description":"Is Really A Happy Day",
                    //           "url":"URL",
                    //           "picurl":"PIC_URL"
                    //         }
                    //     ],
                    //     openId: req.weixin.FromUserName
                    // }
                ]).then(res => {
                    MsgIds[req.weixin.MsgId].isSend = true;
                    res.reply();
                });
                break;
            default:
                res.transfer2CustomerService();

            MsgIds[req.weixin.MsgId].isSend = true;
        }
    }
}));

app.listen(8084, '0.0.0.0', function(err) {
    if (!err) console.log('启动');
});