const https = require('https');
//const request = require('request');
const logger = require('./logger');
const esclient = require('./es');

function process_ngsi(req) {
  let data = []
  let path = ""
  let path_list = req.originalUrl.split( '/' ).filter(f => f != '');

  if (path_list.length <= 2 && path_list.length > 0) {
     path = "/"+path_list[0]+"/_doc"
  }
  else {
    logger.error("Request path is incorrect");
    return false;
  }

  let obj = JSON.parse(req.body);
  obj.contextResponses.forEach(entity => {
    let record = {
      subscriptionId: obj.subscriptionId,
      originator: obj.originator,
      entityID: entity.contextElement.id,
      entityType: entity.contextElement.type,
      //header: req.headers
      fiware_service: req.headers['fiware-service'],
      fiware_servicepath: req.headers['fiware-servicepath'],
    }

    if (path_list.length == 2) {
      record['type'] = path_list[1]
    }

    entity.contextElement.attributes.forEach( attribute => {
      let value = attribute.value;
      if (! isNaN(Number(value))) {
        value = Number(value)
      }
      record[attribute.name.replace(/\s+/, "")] = value

    });

    //### overwrite Field: location ###
    if (record['location'] !== undefined) {
      //console.log('location: ')
      //console.log(JSON.stringify(data['location']))
      record['location'] = record['location']['coordinates']
      //console.log(JSON.stringify(data))
    }

    record['timestamp'] = new Date(new Date().toUTCString())

    data.push(record)
  });
  es_data(path_list[0], data)
  return true;
}

function es_data(index, data) {
  if (data.length > 1) {
    const payload = data.flatMap(record => [{ index: { _index: index } }, record])
    es_bulk(index,payload)
  }
  if (data.length == 1) {
    es_index(index, data[0])
  }
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
    logger.debug(JSON.stringify(response))
  }
}

async function es_index(index, record) {
  // Let's start by indexing some data
  await esclient.index({
    index: index,
    // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
    body: record
  }, (err, result) => {
    if (err) {
      logger.error('index = '+index);
      logger.error('method = client.index()')
      logger.error('data = '+JSON.stringify(record));
      logger.error(JSON.stringify(err))
    }
    logger.debug(JSON.stringify(result))
  })
}


exports.process_orion = function(req, res, next) {
  logger.debug('Process data from Orion IP address: '+ req.ip);
  //logger.info('header: ' + JSON.stringify(req.headers,null,2))
  if (req.get('Content-Type')) {
    res = res.type(req.get('Content-Type'));
  }
  if (process_ngsi(req)) {
    res = res.status(200);
    res.send("");
    //res.send(req.body);
  }
  else {
    res = res.status(404);
    res.send("failed");
  }

  next();
};
