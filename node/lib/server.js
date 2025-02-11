const MongoClient = require('mongodb').MongoClient;
const express = require('express');

const app = express();

const port = process.env.RDT_NODE_PORT || 80;
const dbUrl = process.env.RDT_NODE_DB_URL || 'mongodb://mongo:27017';
const dbName = process.env.RDT_NODE_DB_NAME || 'rdt';
const dbClient = new MongoClient(dbUrl);

async function runMigrations(db) {
  await db.createCollection('movies');
}

async function main() {
  await dbClient.connect((err) => {
    if (err) throw err;
  });

  const db = dbClient.db(dbName);

  await runMigrations(db);

  app.get('/', (req, res) => {
    // db.collection('movies')
    //   .find()
    //   .toArray((err, result) => {
    //     if (err) throw err;

    //     console.log(result);
    //     res.send(result);
    //   });

    res.send('Hello World!');
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
