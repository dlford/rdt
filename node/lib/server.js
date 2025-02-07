const MongoClient = require('mongodb').MongoClient;
const express = require('express');

const url = 'mongodb://mongo:27017';
const dbName = 'rdt';
const client = new MongoClient(url);

client
  .connect((err) => {
    if (err) throw err;
  })
  .then((client) => {
    const db = client.db(dbName);

    const app = express();

    app.get('/', (req, res) => {
      // db.collection('movies')
      //   .find()
      //   .toArray((err, result) => {
      //     if (err) throw err;

      //     console.log(result);
      //   });

      res.send('Hello World!');
    });

    app.listen(80, () => {
      console.log('Example app listening on port 80!');
    });
  });
