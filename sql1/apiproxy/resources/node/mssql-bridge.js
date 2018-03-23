// mssql-bridge.js
// ------------------------------------------------------------------
//
// Bridge into SQL Server, from Apigee Edge.
//
// created: Wed Jun 22 18:45:52 2016
// last saved: <2016-June-27 14:18:15>

var sql = require("seriate"),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    dbConfigured = false,
    async = require('async'),
    apigee = require('apigee-access');

var dbconfig = require('./config/dbconfig.js');
var dataconfigs = require('./config/dataconfigs.js');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


function insureDbConfigured(cb) {
  if (dbConfigured) {
    return cb();
  }

  console.log('reading the vault...');
  var vault = apigee.getVault('connectionStrings', 'organization');
  if( ! vault) {
    console.log('there is no vault!');
    return cb();
  }

  var key = 'sql.' + dbconfig.serverName;
  vault.get(key, function(e, secret) {
    if (e) {
      console.log('error retrieving from vault: ' + e);
      return cb();
    }
    var buf = new Buffer(secret, 'base64');
    var config = JSON.parse(buf.toString());
    sql.setDefaultConfig( config );
    dbConfigured = true;
    cb();
  });
}


function doSqlQuery(query, response) {
  var realQuery = (typeof query == 'string') ? {query:query} : query;
  function doWork() {
    sql.execute( realQuery )
      .then(
        function( results ) {
          var result = {
                count: results.length,
                entities : results
              };
          response.status(200)
            .send(JSON.stringify(result, null, 2) );
        },
        function( e ) {
          response.status(500)
            .send(JSON.stringify(e, null, 2) );
        } );
  }
  insureDbConfigured(doWork);
}


app.get('/tables', function(request, response) {
  response.header('Content-Type', 'application/json');
  doSqlQuery("SELECT * FROM INFORMATION_SCHEMA.TABLES", response );
});

app.get('/products', function(request, response) {
  response.header('Content-Type', 'application/json');
  doSqlQuery(dataconfigs.productQuery, response );
});

app.get('/products/:prodnum', function(request, response) {
  var prodnum = request.params.prodnum;
  response.header('Content-Type', 'application/json');
  doSqlQuery(
    {
      query : dataconfigs.productQuery + " where ProductNumber = @prodnum",
      params: {
        prodnum: {
          type: sql.NVARCHAR,
          val: prodnum,
        }
      }
    },
    response );
});

// default behavior
app.all(/^\/.*/, function(request, response) {
  response.header('Content-Type', 'application/json');
  response.status(404)
    .send('{ "message" : "This is not the server you\'re looking for." }\n');
});


var port = process.env.PORT || 5950;
app.listen(port, function() {
  console.log('listening...');
});
