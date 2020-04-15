const request = require('request')

const timeout = 2000

let urls = ['https://risingstack.com','https://www.google.com']
var data = []

setInterval(function() {
  console.log("I am doing my 20 sec check");
  console.log(data);
  data = []
  check_https(urls);
}, timeout);

check_https(urls);

function check_https(urls) {
  urls.forEach(url => {
    console.log(url);
    http_latency(url)
      .then((resp) => {
        //console.log('time: '+ JSON.stringify(res))
        data.push(resp);
    })
  })
}

function http_latency(uri) {
    return new Promise((resolve) => {
      request({
        uri,
        method: 'GET',
        time: true,
        timeout
      }, function (err, resp, body) {
        if (err) resolve('Error')
        if (resp) {
          let record = resp.timings;
          record['url'] = resp.request.uri.href
          record['timestamp'] = new Date(new Date().toUTCString())
          //console.log(record)
          resolve(record)
        }
        //if (body) resolve(body)
      })
    })
}
