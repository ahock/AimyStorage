var config = {};

config.web = {};
config.clientID = 'gb2306fpDknAcuITs3Mf5V73R0MsibOg';
config.storageURL = 'http://storage.iod4all.com:8080';
config.MongoURI = 'mongodb+srv://aimy:aimx4aimy@aimycluster-9in7r.mongodb.net/aimy?retryWrites=true&w=majority';
//config.MongoURI = 'mongodb://ahock:taurus1ted@ds135069.mlab.com:35069/aimy';
// Cloud9 IP
//config.BindIP = '10.0.0.251';
// AWS EC2 instance IP
//config.BindIP = '172.31.14.135';
// Digital Ocean IP
config.BindIP = '138.68.102.77';
config.apiVersion = '0.0.1';
config.version = '0.1.10';
config.comment = 'Added schema/challenge.js';
config.default_stuff =  ['red','green','blue','apple','yellow','orange','politics'];
config.web.port = process.env.WEB_PORT || 9980;

module.exports = config;