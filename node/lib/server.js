const express = require('express');
const axios = require('axios');
const graphServer = require('./graphServer');

const app = express();

const port = +process.env.RDT_NODE_PORT || 3000;
const gqlUrl = process.env.RDT_NODE_GQL_URL || 'http://graphql:4000';

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

    const result = await axios.post(gqlUrl, {
      query: `
        mutation InsertMovies($movies: [Training_Movies_Insert_Input!]!) {
          training {
            movies {
              insert(movies: $movies) {
                message
                success
              }
            }
          }
        }
      `,
      variables: {
        movies,
      },
    });

    if (result?.data?.errors?.length) {
      res.status(500).json(result.data);
      return;
    }

    res.json(result.data);
  });

  app.get('/find', async (req, res, next) => {
    const { title, release_date, id, actor_id, director_id } =
      req.query;

    const input = { title, release_date, id, actor_id, director_id };

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
    const ids = req.query.id;

    const result = await axios.post(gqlUrl, {
      query: `
        mutation RemoveMovies($ids: [ObjectID]) {
          training {
            movies {
              remove(ids: $ids) {
                message
                success
              }
            }
          }
        }
      `,
      variables: {
        ids,
      },
    });

    if (result?.data?.errors?.length) {
      res.status(500).json(result.data);
      return;
    }

    res.json(result.data);
  });

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
