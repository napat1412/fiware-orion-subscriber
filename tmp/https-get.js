const https = require('https');
const url = "https://idm.smart-city.web.meca.in.th/user?access_token=fc7bfc2a20a47aa39b6f1095bfb855a5da9ffca2";
let options = new URL(url);
options['method'] = 'GET';

console.log(options)

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  //console.log(res);
  res.on('data', (d) => {
    //process.stdout.write(d);
    console.log(d.toString());
    let body = JSON.parse(d.toString());
    console.log(body);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
