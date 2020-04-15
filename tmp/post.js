const https = require('https')
const fs = require('fs')

const data = JSON.stringify({
  todo: 'Buy the milk'
})

const options = {
  //rejectUnauthorized: false,
  //ca: fs.readFileSync('/data/certbot/data/live/opendistro.meca.in.th/fullchain.pem'),
  hostname: 'opendistro.meca.in.th',
  port: 9200,
  path: '/smartcity-post/_doc',
  method: 'POST',
  headers: {
    'Authorization': 'Basic <SECERT>',
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  }
}

//console.log("ca :" + options['ca'])

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data)
req.end()
