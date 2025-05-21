const express = require('express');
const graphServer = require('./graphServer');

const app = express();

const port = +process.env.RDT_NODE_PORT || 3000;

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
    const moviesArg = req.query.movies;

    let movies;
    try {
      movies = JSON.parse(moviesArg);
    } catch (e) {
      console.error(e);
      res.status(400).json({
        success: false,
        message: 'invalid argument for `movies`',
      });
      return;
    }

    const input = { movies };

    const fields = `
      message
      success
    `;

    try {
      const result = await graphServer.insert_movies({ input, fields });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message:
          err?.graphQLErrors?.[0]?.message ||
          'An unknown error occured',
      });
      return;
    }
  });

  app.get('/find', async (req, res, next) => {
    const input = req.query;

    const fields = `
        docs {
          id
          release_date
          title
          director {
            id
            first_name
            last_name
          }
          actors {
            id
            first_name
            last_name
          }
        }
      `;

    try {
      const result = await graphServer.find_movies({ input, fields });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message:
          err?.graphQLErrors?.[0]?.message ||
          'An unknown error occured',
      });
      return;
    }
  });

  app.get('/remove', async (req, res) => {
    const input = { ids: req.query.id };

    const fields = `
      message
      success
    `;

    try {
      const result = await graphServer.remove_movies({ input, fields });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message:
          err?.graphQLErrors?.[0]?.message ||
          'An unknown error occured',
      });
      return;
    }
  });

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
