var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var fs = require('fs');

const config = require('./config');

var app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));

app.all('*', function (req, res) {
  console.log(req.body);
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  res.send(req.body);
});



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
  console.log(options)

  server = https.createServer(options, app);
}
else {
  server = http.createServer(app);
}

server.listen(config.os.port, function () {
  console.log("Log Level " + config.loglevel)
  console.log("Listening on port %d", server.address().port)
});

