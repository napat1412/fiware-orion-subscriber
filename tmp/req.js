const request = require('request');

request({
    "rejectUnauthorized": false,
    "url": 'https://opendistro.meca.in.th:9200',
    "method": "GET",
    "headers":{
        "X-API-VERSION": 1,
    },
}, function(err, response, body){
    if (err) { return console.log(err); }
    //console.log(response);
    console.log(body);
});
