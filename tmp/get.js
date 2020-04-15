const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'opendistro.meca.in.th',
  port: 9200,
  path: '/',
  method: 'GET',
  //ca: fs.readFileSync('/data/certbot/data/live/opendistro.meca.in.th/fullchain.pem'),
  ca: fs.readFileSync('./rootchain.pem'),
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
