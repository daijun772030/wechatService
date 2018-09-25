{
var crypto = require('crypto');
var url = require('url');
exports.wechatCheckToken = function(req,res, next){
    var query = url.parse(req.url,true).query;
    console.log('query==> %o', query);
	var signature = query.signature;
	var timestamp = query.timestamp;
	var nonce = query.nonce;
    var echostr = query.echostr;
    console.log('echostr==> %s', echostr);
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
 
function check(timestamp,nonce,signature,token){
    var currSign,tmp;
    console.log('token==> %s', token);
    tmp = [token,timestamp,nonce].sort().join("");
    console.log('tmp==> %s', tmp);
    currSign = crypto.createHash("sha1").update(tmp).digest("hex");
    console.log('currSign==> %s  signature===> %s', currSign, signature);
	return (currSign === signature);  
}}