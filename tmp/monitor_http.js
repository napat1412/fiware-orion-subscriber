const request = require('request')
const logger = require('./logger')
const esclient = require('./es')

const timeout = 20000

let urls = [
  "http://203.185.64.32:65080",
  "http://203.185.64.1:65080",
  "http://203.185.64.2:65080",
  "http://203.185.64.3:65080",
  "http://203.185.64.4:65080",
  "http://203.185.64.5:65080",
  "http://203.185.64.6:65080",
  "http://203.185.64.7:65080",
  "http://203.185.64.8:65080",
  "http://203.185.64.9:65080",
  "http://203.185.64.10:65080",
  "http://203.185.64.11:65080",
  "http://203.185.64.12:65080",
  "http://203.185.64.13:65080",
  "http://203.185.64.14:65080",
  "http://203.185.64.15:65080",
  "http://203.185.64.16:65080",
  "http://203.185.64.17:65080",
  "http://203.185.64.18:65080",
  "http://203.185.64.19:65080",
  "http://203.185.64.20:65080",
]
var data = []
const index = 'smartcity-http'

setInterval(function() {
  console.log("Update data to es every %d sec",timeout/1000);
  //console.log(data);
  if (data.length > 1) {
    const payload = data.flatMap(record => [{ index: { _index: index } }, record])
    es_bulk(index,payload)
  }
  data = []
  check_https(urls);
}, timeout);

check_https(urls);

async function check_https(urls) {
  urls.forEach(function (url,i) {
    //console.log(new Date(new Date().toUTCString()) + " " + url+ " "+i)
    http_latency(url,i)
      .then((resp) => {
        console.log('time: '+ JSON.stringify(resp))
        data.push(resp);
    })
  })
}

function http_latency(uri, id) {
    return new Promise((resolve) => {
      request({
        uri,
        method: 'GET',
        time: true,
        timeout
      }, function (err, resp, body) {
        let record = {}
        if (err) {
          console.log('----> error occured: reject')
          record = {
            socket: timeout,
            lookup: timeout,
            connect: timeout,
            response: timeout,
            end: timeout,
          },
          record['url'] = uri
          record['timestamp'] = new Date(new Date().toUTCString())
          //console.log(record)
          resolve(record)

        }
        if (resp) {
          record = resp.timings;
          //console.log(resp.request.uri);
          record['url'] = resp.request.uri.href
          record['timestamp'] = new Date(new Date().toUTCString())
          //console.log(record)
          resolve(record)
        }
        //if (body) resolve(body)
      })
    })
}

async function es_bulk(index, data) {

  const { body: response } = await esclient.bulk({ refresh: true, body: data })

  if (response.errors) {
    const erroredDocuments = []
    // The items array has the same order of the data we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    response.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: data[i * 2],
          document: data[i * 2 + 1]
        })
      }
    })
    logger.error('index = ' + index)
    logger.error('method = client.bulk()')
    logger.error(JSON.stringify(erroredDocuments))
  }
  else {
    logger.info(JSON.stringify(response))
  }
}
