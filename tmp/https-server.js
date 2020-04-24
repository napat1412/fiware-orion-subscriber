var express = require('express');
var https = require('https');
var fs = require('fs');
const config = require('./config');

const logger = require('./logger');
const router = require('./router');

var app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));

app.use('*', function (req, res) {
  console.log(req.body);
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  res.send(req.body);
})


var ca = ""
var oskey = fs.readFileSync('./pki/orionsubscriber-key.pem');
var oscert = fs.readFileSync('./pki/orionsubscriber-cert.pem');
//var oskey = fs.readFileSync('/data/certbot/data/live/opendistro.meca.in.th/privkey.pem')
//var oscert = fs.readFileSync('/data/certbot/data/live/opendistro.meca.in.th/fullchain.pem')
//var ca = fs.readFileSync('/data/certbot/data/live/opendistro.meca.in.th/fullchain.pem')

console.log(config)
console.log('oskey: ' + oskey)
console.log('oscert: ' + oscert)

const options = {
  key: oskey,
  cert: oscert,
  ca: ca
};

var server = https.createServer(options, app);
server.listen(config.os.port, function () {
  console.log("Log Level " + config.loglevel)
  console.log("Listening on port %d", server.address().port)
});
