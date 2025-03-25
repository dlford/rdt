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

// ISO 8601 date string
const dateRegex = /^\d{4}-([0][1-9]|1[0-2])-([0][1-9]|[1-2]\d|3[01])$/;

async function main() {
  await dbClient.connect((err) => {
    if (err) throw err;
  });

  const db = dbClient.db(dbName);

  await runMigrations(db);

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  // app.get('/movies', async (req, res) => {
  //   const result = await db.collection('movies').find().toArray();

  //   res.send(result);
  // });

  app.get('/insert', async (req, res) => {
    const moviesArg = req.query.movies;

    if (!moviesArg) {
      res.send(
        {
          success: false,
          message:
            'Must include the query param `movies` as an array of movie objects',
        },
        400,
      );
      return;
    }

    let movies;
    try {
      movies = JSON.parse(moviesArg);
    } catch (e) {
      console.error(e);
      res.send(
        {
          success: false,
          message:
            'Must include the query param `movies` as an array of movie objects, failed to JSON parse movies',
        },
        400,
      );
      return;
    }

    if (!Array.isArray(movies)) {
      res.send(
        {
          success: false,
          message:
            'Must include the query param `movies` as an array of movie objects, movies is not an array',
        },
        400,
      );
      return;
    }

    if (
      !movies.every(
        ({ title, release_date }) => !!title && !!release_date,
      )
    ) {
      res.send(
        {
          success: false,
          message: 'All movies must have a `title` and `release_date`',
        },
        400,
      );
      return;
    }

    if (
      !movies.every(({ release_date }) => dateRegex.test(release_date))
    ) {
      res.send(
        {
          success: false,
          message:
            '`release_date` must match ISO 8601 date string format',
        },
        400,
      );
      return;
    }

    await db.collection('movies').insertMany(movies);

    res.send({
      success: true,
      message: `Added movies: ${movies
        .reduce((acc, cur) => {
          return [...acc, cur.title];
        }, [])
        .join(', ')}`,
    });
  });

  app.get('/find', async (req, res) => {
    res.status(501);
    res.send('Not Implemented');
  });

  app.get('/remove', async (req, res) => {
    res.status(501);
    res.send('Not Implemented');
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
