# MS SQL API Proxy

This is an Apigee Edge API Proxy that connects to Microsoft SQL Server via the [npm module seriate](https://www.npmjs.com/package/seriate)
which itself relies on the [npm module mssql](https://www.npmjs.com/package/mssql).

This demonstrates an easy way to produce APIs on an existing MS SQL Database. It currently works against the Adventure Works sample database which was distributed with SQL Server 2008.  But it will work with any database, any table, even views and stored procedures. 

## How it works

The API Proxy relies on the nodejs support within Apigee Edge. Users do not need to provision a server to run nodejs; it runs inside Apigee Edge.
Users CAN modify the nodejs code to do whatever it is they want to do, to connect to the database server.

## API Endpoints Exposed

These are the endpoints available in this demonstration. 

```
GET /tables
```

```
GET /products
```

```
GET /products/:prodnum
```

These make sense because the database is Adventure Works, and "products" is a table in that DB.  If you change the database, you would need to modify the mssql-bridge.js file to change these endpoints or extend them. 

## Connection information

The information needed to connect to a SQL Server database includes the server name or IP address, the port, and user authentication.
It might look like this:

```js
var dbconfig = {
      "server": "10.20.30.44",
      "port": "1433",
      "user": "admin",
      "password": "SomethingSecret",
      "database": "AVWKS2008"
    };
```

## Let's talk about Secrets

Typically, some (all?) information related to the server connection - the server
name, port, username, and password - are secret.  Apigee Edge has a feature called
"the vault" which can store secrets. Rather than storing each one of those pieces
of information separately, and then assembling the connection JSON at runtime, the
way this API Proxy works is to retrieve the JSON hash for the server connection
from the vault in its entirety.  For an extra layer of protection, this proxy uses
base64 encoding of the JSON hash.  This won't prevent disclosure, but it will
prevent a casual glance at a screen from resulting in a disclosure.

Here are the steps to insert the connection details into the Vault.

1. Create a vault with the name "connectionStrings" within Apigee Edge. You need to do this only once, ever. Like this:

        export edgeorg="myorgname"
        export edgeenv="test"

        # Create the vault (do this once only):
        curl -i -n -X POST -H content-type:application/json $mgmtserver/v1/o/$edgeorg/vaults -d '{"name": "connectionStrings"}'

    You will need to have administrative credentials on the Edge organization. 
   
2. Run [the included script](./produceVaultableConnectionString.js) to help produce the
    base64-encoded string that represents the database connection details, to be stored
    in the Vault. This script is very simple.  It does something like this:

        var dbconfig = {
             "server": "1.2.3.4",
             "port": "1433",
             "user": "admin",
             "password": "SomethingSecret",
             "database": "AVWKS2008"
        };
        var value = new Buffer(JSON.stringify(dbconfig)).toString('base64');
        console.log('value: ' + value);
        console.log();
   
    ...but with a few other elaborations. 
    The encoded string will look something like this: `eyakjskjskjsksj...juywd93eu`

3. Insert the stringified, then encoded JSON hash into the vault.  Do this once, for
    each SQL Server you may connect to:
   
        # insert an entry into the vault (do this for each sql server):
        curl -i -n -X POST \
          -H content-type:application/json \
        $mgmtserver/v1/o/$edgeorg/vaults/connectionStrings/entries \
        -d '{
          "name" : "sql.sql2008",
          "value" : "eyakjskjskjsksj...juywd93eu"
        }'
   
    You should use a "name" that begins with sql, followed by a dot. If the server name is sql2008, then the name for the vault entry ought to be "sql.sql2008".


4. Specify the name of the DB Server in the config/dbconfig.js file.

        var config = {
           serverName: 'sql2008'
        };

        module.exports = config;

    You then need to re-deploy the API Proxy with this updated information. At runtime the API Proxy will retrieve information from the vault, and reconstitute the connection hash.
   
        var dbconfig = base64Decode(readVault());  // pseudo-code
        //   dbconfig = {
        //      "server": "10.20.30.44",
        //      "port": "1433",
        //      "user": "admin",
        //      "password": "SomethingSecret",
        //      "database": "AVWKS2008"
        //    };



## Configuring queries

You can specify queries within config/dataconfigs.js  If you change this file, you will also need to change the nodejs server to use those new settings. 


## Removing Server Connection Information from the Vault

To remove information from the vault, just use the appropriate DELETE command.  For example, 

```shell
  curl -n -i -X DELETE $mgmtserver/v1/o/$edgeorg/vaults/connectionStrings/entries/sql.sql2008
```



## Futures


1. Loading SQL From Static files

    The seriate module supports loading SQL from static files. This is [described here](http://developer.leankit.com/painless-sql-server-with-nodejs-and-seriate/). This could be  a nice extension to the demonstration here.  The Set of files with queries could map to the APIs exposed by the bridge.  Change the set of SQL files, and new APIs appear. It would be very simple to do this. 


2. A more exotic future expansion would be to simply generate the mssql-bridge.js code dynamically, based on the tables in the database. 



