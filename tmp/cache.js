const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 5, checkperiod: 12 } );

success = myCache.set( "myKey", true, 10 );
success = myCache.set( "std", true );

function check_cache(id) {
  value = myCache.get( id );
  //if ( value == undefined ){
    // handle miss!
  //}
  console.log(id+": " +value)
}

function intervalFunc() {
  check_cache("myKey")
  check_cache("std")
}

setInterval(intervalFunc,2000);


