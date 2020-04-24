//const https = require('https');
const request = require('request');
const fs = require('fs');
var AsyncLock = require('async-lock');

var lock = new AsyncLock();
const NodeCache = require( "node-cache" );
const valid_token = new NodeCache( { stdTTL: 3600, checkperiod: 120 } );

//const token = "ba3c45a5661f8d3ce92652dcd886c3f0d57718af";
const token = "fc7bfc2a20a47aa39b6f1095bfb855a5da9ffca2";
const check_app = true;
//const check_app = false;
//const valid_app = ["2e8f4871-a2e2-4091-83ec-49551158dab6","2e8f4871-a2e2-4091-83ec-49551158dab7"];
const valid_app = ["adf704e9-fb6f-4890-b734-b32f94b861f1"];


/*function check_token(access_token) {
  get_uri('https://idm.smart-city.web.meca.in.th/user?access_token=' + access_token)
    .then((resp) => {
      console.log('resp: '+ JSON.stringify(resp))
    })
}*/

function get_uri(uri) {
  return new Promise((resolve) => {
    request({
      uri,
      method: 'GET'
    }, function (err, resp, body) {
      if (err) reject(err)
      if (resp) {
        //console.log("--- resp")
        //console.log(resp)
        resolve(resp)
      }
    })
  })
}  

function operation(access_token) {
  if ( valid_token.get(access_token) == undefined ) {
    console.log(access_token + " calling operation");
    lock.acquire(access_token, function(done) {
      console.log(access_token + " Running operation");
      if ( valid_token.get(access_token) == undefined ) {
        //check_token(access_token);

        get_uri('https://idm.smart-city.web.meca.in.th/user?access_token=' + access_token)
          .then((resp) => {
            if(resp.statusCode == 200) {
              //console.log(resp.body)
              let body = JSON.parse(resp.body);
              console.log(body.app_id);
              if (check_app) {
                if (valid_app.indexOf(body.app_id) > -1) {
                  console.log("------- Check app & Add token: "+access_token+" to valid_token ")
                  result = valid_token.set(access_token, true, 5);
                }
                else {
                  console.log("------- Check app & Add token: "+access_token+" to blocked_token ")
                  result = valid_token.set(access_token, false, 5);
                }
              }
              else {
                console.log("------- Add token: "+access_token+" to valid_token ")
                result = valid_token.set(access_token, true, 5);
              }
            }
            else {
              console.log("------- Add token: "+access_token+" to blocked_token ")
              result = valid_token.set(access_token, false, 5);
            }
            done();
          })
          .catch((err) => {
            console.log("!!! http connection to keyrock server error");
            console.log(err);
            done();
          })

      }
      else {
        console.log("Token: "+access_token+" is exist in valid_token")
        done();
      }
    }, function(err, ret) {
      console.log(access_token + " Freeing lock", ret)
    }, {});
  }
  else {
    console.log("------ Cache HIT!!! Status of Token: "+access_token+" is "+valid_token.get(access_token));
  }
}

function intervalFunc() {
  operation(token)
  operation(token)
  operation("5e726ab2a075b5b66e110c1d82f6bc4ff632fb93")
}

setInterval(intervalFunc,1000);
