const https = require('https');
const NodeCache = require( 'node-cache' );
var AsyncLock = require('async-lock');
const request = require('request');
const logger = require('./logger');
const esclient = require('./es');
const config = require('./config');

var lock = new AsyncLock();
const cache_tokens = new NodeCache( { stdTTL: 3600, checkperiod: 360 } );

const orion_verification = config.orion_verification;

function get_uri(uri,https_verification) {
  return new Promise((resolve) => {
    request({
      uri,
      method: 'GET',
      rejectUnauthorized: https_verification,
    }, function (err, resp, body) {
      if (err) reject(err)
      if (resp) {
        resolve(resp)
      }
    })
  })
}

function process_ngsi(req) {
  let data = []
  let path = ""
  let path_list = req.originalUrl.split( '/' ).filter(f => f != '');

  if (path_list.length <= 2 && path_list.length > 0) {
     path = "/"+path_list[0]+"/_doc"
  }
  else {
    logger.error("Request IP address: " + req.connection.remoteAddress);
    logger.error("Request path: "+ req.originalUrl +" is incorrect");
    return false;
  }

  //let obj = JSON.parse(req.body);
  let obj = {};
  try {
    obj = JSON.parse(req.body);
  } catch (e) {
    logger.error("Request IP address: " + req.connection.remoteAddress);
    logger.error("Request path: " + req.originalUrl);
    logger.error("Request body: " + req.body);
    logger.error(e);
    return false;
  }
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

/* Process Orion has function to tranform NGSI data to save to Elasticsearch.
   If the request has multiple record, this function use Elasticsearch bulk api to save data.
*/

exports.process_orion = function(req, res, next) {
  logger.debug('----- process_orion ')
  logger.debug('Process data from Orion IP address: '+ req.ip);
  //logger.info('header: ' + JSON.stringify(req.headers,null,2))
  //logger.info('authentication header: ' + req.headers.authorization)
  //logger.info('body: ' + JSON.stringify(JSON.parse(req.body),null,2))
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

/* Verify Orion Token has function to verify oauth2 access token from orion with keyrock server depend on config: orion_verification.
   If the token is valid, this function forward request to next middleware, Else reject the request.
   Both valid token and invalide token will save to cache for 3600 second (oauth2 access token lifetime for keyrock).
   This function use lib async-lock to manage cache and reduce number of http request to keyrock server for verify token.
*/
exports.verify_orion_token = function(req, res, next) {
  logger.debug('----- verify_orion_token ')
  if (orion_verification.enabled == true) {
    logger.debug('HTTP header['+orion_verification.authorization_key+'] has value: ' + req.headers[orion_verification.authorization_key.toLowerCase()])
    if (req.headers[orion_verification.authorization_key.toLowerCase()] != undefined) {
      let access_token = req.headers.authorization.replace(orion_verification.authorization_prefix_value+" ", "");

      if ( cache_tokens.get(access_token) == undefined ) {
        logger.debug("Access Token [" + access_token + "] -- Calling lock operation");
        lock.acquire(access_token, function(done) {
          logger.debug("Access Token [" + access_token + "] -- Running lock operation");
          if ( cache_tokens.get(access_token) == undefined ) {

            //get_uri('https://idm.smart-city.web.meca.in.th/user?access_token=' + access_token)
            get_uri(orion_verification.keyrock_endpoint+'/user?access_token=' + access_token, orion_verification.keyrock_endpoint_verification)
              .then((resp) => {
                if(resp.statusCode == 200) {
                  let body = JSON.parse(resp.body);

                  if (orion_verification.client_verification.enabled) {
                    if (orion_verification.client_verification.client_ids.indexOf(body.app_id) > -1) {
                      logger.debug("Client Verification Success & Add Token: "+access_token+" to cache_tokens ")
                      result = cache_tokens.set(access_token, true);
                      done();
                      next();
                    }
                    else {
                      logger.debug("Client Verification Fiiled & Add Token: "+access_token+" to blocked_token ")
                      result = cache_tokens.set(access_token, false);
                      done();
                      return res.sendStatus(401);
                    }
                  }
                  else {
                    logger.debug("Bypass Client Verification & Add Token: "+access_token+" to cache_tokens ")
                    result = cache_tokens.set(access_token, true);
                    done();
                    next();
                  }
                }
                else {
                  logger.debug("Add Token: "+access_token+" to blocked_token ")
                  result = cache_tokens.set(access_token, false);
                  done();
                  return res.sendStatus(401);
                }
              })
              .catch((err) => {
                logger.error("!!! HTTP connection to keyrock server error");
                logger.error(err);
                done();
                return res.sendStatus(401);
              })

          }
          else if ( cache_tokens.get(access_token) == true ) {
            logger.debug("Cache L2 HIT!!! Status of Token: "+access_token+" is valid");
            done();
            next();
          }
          else {
            logger.debug("Cache L2 HIT!!! Status of Token: "+access_token+" is invalid");
            done();
            return res.sendStatus(401);
          }
        }, function(err, ret) {
          logger.debug("Access Token [" + access_token + "] -- Freeing lock");
        }, {});
      }
      else if ( cache_tokens.get(access_token) == true ) {
        logger.debug("Cache L1 HIT!!! Status of Token: "+access_token+" is valid");
        next();
      }
      else {
        logger.debug("Cache L1 HIT!!! Status of Token: "+access_token+" is invalid");
        return res.sendStatus(401);
      }
    }
    else {
      logger.error('HTTP header[' + orion_verification.authorization_key + '] is undifined');
      return res.sendStatus(401);
    }
  }
  else {
    logger.debug("Bypass Token Verification")
    next()
  }
};
