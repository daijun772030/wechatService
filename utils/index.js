var crypto = require('crypto');
var url = require('url');
var https = require('https');
var WechatAPI = require('wechat-api');
var api = new WechatAPI('wxe81288f5ea1062fa', '7ea2af72f3d88346bc12c17d7bd6f81d');

function check(timestamp,nonce,signature,token){
    var currSign,tmp;
    // console.log('token==> %s', token);
    tmp = [token,timestamp,nonce].sort().join("");
    // console.log('tmp==> %s', tmp);
    currSign = crypto.createHash("sha1").update(tmp).digest("hex");
    // console.log('currSign==> %s  signature===> %s', currSign, signature);
	return (currSign === signature);  
}

exports.wechatCheckToken = function(req,res, next){
    var query = url.parse(req.url,true).query;
    console.log('query==> %o', query);
	var signature = query.signature;
	var timestamp = query.timestamp;
	var nonce = query.nonce;
    var echostr = query.echostr;
    // console.log('echostr==> %s', echostr);
    if(!echostr) {
        next();
        return;
    }
	if(check(timestamp,nonce,signature,"wechat")){
		res.end(echostr);
	}else{
		res.end("It is not from weixin");
    }
    
};

// 获取微信token
exports.getAccessToken = function(options) {
    return new Promise(function(resolve, reject) {
        var buffer = [],result = "";
        const req = https.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${options.appid}&secret=${options.secret}`, (res) => {
            res.on('data', (data) => {
                buffer.push(data);
            });
            res.on('end',function(){
                result = Buffer.concat(buffer,buffer.length).toString('utf-8');
                console.log('======>', buffer);
                console.log('======>', Buffer.concat(buffer,buffer.length));
                console.log('=======>', result);
                resolve(result);
            });
        });
          
        req.on('error', (e) => {
            reject(e);
        });
        req.end();
    });
}



/******************* 封装wechat-api为Promise方式 ************************/

// 发送消息的方法映射map
const mssageMap = {
    text: 'sendText',
    image: 'sendImage'
}

// 上传素材
exports.uploadMedio = function(url, type) {
    return new Promise(function(resolve, reject) {
        api.uploadMedia(url, type, function(error, result) {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

/**
 * 封装发送消息方法为promise方便链式发送
 *
 * @param {*} type      发送消息类型，通过匹配mssageMap自动匹配方法
 * @param {*} content	发送的内容，如果是图片就是media_id
 * @param {*} openId	消息接收的人openId
 * @returns
 */
var sendMessage = function({type, content, openId}) {
    return new Promise(function(resolve, reject) {
        api[mssageMap[type]](openId, content, function(error, result) {
            if (error) reject(error);
            else resolve(result);
        });
    });
}


exports.sendMessageBatch = function(list) {
    const promisList = list.map(item => sendMessage(item));
    return Promise.all(promisList);
}