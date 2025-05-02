const express = require('express');

const app = express();

const port = process.env.RDT_NODE_PORT || 80;
// const gqlUrl = process.env.RDT_NODE_GQL_URL || 'http://graphql:4000';

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res
    .status(500)
    .json({ success: false, message: 'An unknown error occured' });
}

async function main() {
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.get('/insert', async (req, res) => {
    // const movies = req.query.movies;

    res.status(501).send('Not Implemented');
  });

  app.get('/find', async (req, res, next) => {
    // const title = req.query.title;
    // const releaseDate = req.query.release_date;
    // const id = req.query.id;

    res.status(501).send('Not Implemented');
  });

  app.get('/remove', async (req, res) => {
    // const id = req.query.id;

    res.status(501).send('Not Implemented');
  });

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
