// produceVaultableConnectionString.js
// ------------------------------------------------------------------
//
// produce a string that is
//    base64-encode(JSON.stringify(dbconfig))
//
// ...which is suitable for inserting into the vault.
//
// created: Wed Jun 22 19:33:03 2016
// last saved: <2016-June-29 07:57:46>

var dbName = 'sql2008';

var dbconfig = {
      "server": "10.20.30.44",
      "port": "1433",
      "user": "admin",
      "password": "SomethingSecret",
      "database": "AVWKS2008"
    };

console.log('\ndbconfig: ' + JSON.stringify(dbconfig, null, 2) );
console.log('\ndbName: ' + dbName + '\n');
var value = new Buffer(JSON.stringify(dbconfig)).toString('base64');
console.log();

console.log('load the vault with this command:\n');
console.log('curl -i -n -X POST \\');
console.log('   -H content-type:application/json \\');
console.log('    https://api.enterprise.apigee.com/v1/o/$edgeorg/vaults/connectionStrings/entries \\');
console.log('     -d \'{ ');
console.log('       "name" : "sql.'+ dbName + '",');
console.log('       "value" : "' + value +'"');
console.log('     }\'\n');
console.log('and then, be sure to update the dbconfig.json file with the appropriate SQL Server name:\n');
