var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var fs = require('fs');
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
app.use(ipfilter(config.orion_verification.whitelist, { mode: 'allow' , log: false}))

app.use('*', router)


let server
if (config.os.https.enabled) {
  let options = {
      key: fs.readFileSync(config.os.https.key_file).toString(),
      cert: fs.readFileSync(config.os.https.cert_file).toString()
  };
  if (config.os.https.ca_certs) {
      options.ca = [];
      for (var ca in config.os.https.ca_certs) {
          options.ca.push(fs.readFileSync(config.os.https.ca_certs[ca]).toString());
      }
  }
  logger.silly("HTTPS configuration: " + JSON.stringify(options, null, 2))

  server = https.createServer(options, app);
}
else {
  server = http.createServer(app);
}

server.listen(config.os.port, function () {
  logger.info("Log Level " + config.loglevel)
  logger.debug("Configuration: " + JSON.stringify(config, null, 2))
  logger.info("Listening on port %d", server.address().port)
});

