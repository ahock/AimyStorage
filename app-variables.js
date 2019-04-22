var config = {};

config.web = {};

config.clientID = 'gb2306fpDknAcuITs3Mf5V73R0MsibOg';
config.storageURL = 'http://storage.iod4all.com:8080';
config.apiVersion = '0.0.1';

config.default_stuff =  ['red','green','blue','apple','yellow','orange','politics'];

config.web.port = process.env.WEB_PORT || 9980;

module.exports = config;