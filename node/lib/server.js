const express = require('express');
const axios = require('axios');

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
    // const movies = req.query.movies;

    res.status(501).send('Not Implemented');
  });

  app.get('/find', async (req, res, next) => {
    const { title, release_date, id, actor_id, director_id } =
      req.query;

    const result = await axios.post(gqlUrl, {
      query: `
        query FindMovies(
          $id: ObjectID
          $title: String
          $release_date: ISODateString
          $director_id: ObjectID
          $actor_id: ObjectID
        ) {
          training {
            movies {
              find(
                id: $id
                title: $title
                release_date: $release_date
                director_id: $director_id
                actor_id: $actor_id
              ) {
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
              }
            }
          }
        }
      `,
      variables: {
        title,
        release_date,
        id,
        actor_id,
        director_id,
      },
    });

    if (result?.data?.errors?.length) {
      res.status(500).json(result.data);
      return;
    }

    res.json(result.data);
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
