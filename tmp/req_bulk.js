const request = require('request');
const logger = require('./logger');
const esclient = require('./es');

var data = []
data.push(
  { index: {_index: 'smartcity-game' } },
  {
    character: 'Lokios',
    quote: 'Raknarok is coming.'
  }
)
var i = { index: {_index: 'smartcity-game' } }
var record = {
  character: 'Thor',
  quote: 'Thunder.'
}
data.push(i, record)

//bulk2('smartcity-game',data);
es_index('smartcitty-game',record)

async function es_index(index, record) {
  // Let's start by indexing some data
  await esclient.index({
    index: index,
    // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
    body: record
  }, (err, result) => {
    if (err) {
       logger.error('--- esclient error');
       logger.error('index '+index);
       logger.error('data '+data);
       logger.error(JSON.stringify(err))
    }
  })
}



async function bulk2(index, dataset) {
  const body = dataset.flatMap(record => [{ index: { _index: index } }, record])

  const { body: response } = await esclient.bulk({ refresh: true, body })

  if (response.errors) {
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
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
          operation: body[i * 2],
          document: body[i * 2 + 1]
        })
      }
    })
    console.log(erroredDocuments)
  }
  logger.info(JSON.stringify(response))
} 

async function bulk () {
  // Let's start by indexing some data
  data.forEach(function(value) {
    console.log(value);
  });
  await esclient.bulk({
    //index: 'smartcity-game',
    // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
    body: data
  },(err, result) => {
    if (err) {
      console.log(result)
      console.log(err)
      console.log(err.meta.body.error)
      //logger.error(JSON.stringify(err))
      //logger.error(JSON.stringify(err.meta.body.error))
    }
  })
}

async function run () {
  // Let's start by indexing some data
  await esclient.index({
    index: 'smartcity-game',
    // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
    body: {
      character: 'Ned Stark',
      quote: 'Winter is coming.'
    }
  })
  logger.info('esclient: game');
}

