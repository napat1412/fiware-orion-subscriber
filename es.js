const { Client } = require('@elastic/elasticsearch')
const config = require('./config')
const logger = require('./logger')

esconfig = {
  //node: 'https://localhost:9200',
  // # Headers: JWT TOKEN
  //headers: { 'X-Token-Auth': <JWT_TOKEN> },
  // # Headers: Basic Authentication
  //headers: { 'Authorization': 'Basic <SECRET>'},

  headers: { },

  maxRetries: 0,
  requestTimeout: 60000,

  /*ssl: {
    //ca: fs.readFileSync('./cacert.pem'),
    rejectUnauthorized: false
  }*/
}

esconfig['nodes'] = config.es.nodes
if (config.es.user !== undefined && config.es.pass !== undefined) {
  esconfig['auth'] = {}
  esconfig['auth']['username'] = config.es.user
  esconfig['auth']['password'] = config.es.pass
}
if (config.es.header_key !== undefined && config.es.header_value !== undefined) {
  esconfig['headers'][config.es.header_key] =  config.es.header_value
}

//logger.debug('ELASTICSEARCH CONFIG: '+JSON.stringify(esconfig))
//console.log('esnodes '+ config.es_nodes)
//console.log('esnodes '+ typeof config.es_nodes)

const esclient = new Client(esconfig)

module.exports = esclient;
