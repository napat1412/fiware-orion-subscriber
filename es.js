const { Client } = require('@elastic/elasticsearch')
const config = require('./config')
const logger = require('./logger')

esconfig = {
  //node: 'https://opendistro.meca.in.th:9200',
  // # Headers: JWT TOKEN
  //headers: { 'X-Token-Auth': <JWT_TOKEN> },
  // # Headers: Basic Authentication
  //headers: { 'Authorization': 'Basic <SECRET>'},

  headers: { },

  maxRetries: 0,
  requestTimeout: 60000,
  sniffOnStart: true,

  /*ssl: {
    //ca: fs.readFileSync('./cacert.pem'),
    rejectUnauthorized: false
  }*/
}

esconfig['nodes'] = config.es_nodes
if (config.es_user !== undefined && config.es_pass !== undefined) {
  esconfig['auth'] = {}
  esconfig['auth']['username'] = config.es_user
  esconfig['auth']['password'] = config.es_pass
}
if (config.es_header_key !== undefined && config.es_header_value !== undefined) {
  esconfig['headers'][config.es_header_key] =  config.es_header_value
}

logger.debug('ELASTICSEARCH CONFIG: '+JSON.stringify(esconfig))
//console.log('esnodes '+ config.es_nodes)
//console.log('esnodes '+ typeof config.es_nodes)

const esclient = new Client(esconfig)

module.exports = esclient;
