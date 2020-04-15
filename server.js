var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
const ipfilter = require('express-ipfilter').IpFilter;

const logger = require('./logger');
const router = require('./router');
const config = require('./config');
 
var app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));
app.use(ipfilter(config.orion_whitelist, { mode: 'allow' , log: false}))

app.use('*', router)

var server = app.listen(config.port, function () {
  logger.info("Log Level " + config.loglevel)
  //logger.silly("Listening on port %d", server.address().port)
  //logger.debug("Listening on port %d", server.address().port)
  //logger.verbose("Listening on port %d", server.address().port)
  //logger.http("Listening on port %d", server.address().port)
  logger.info("Listening on port %d", server.address().port)
  //logger.warn("Listening on port %d", server.address().port)
  //logger.error("Listening on port %d", server.address().port)
});
