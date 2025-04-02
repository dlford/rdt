const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const { ObjectId } = require('mongodb');

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

  process.on('exit', async () => {
    await dbClient.close();
  });

  const db = dbClient.db(dbName);

  await runMigrations(db);

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.get('/insert', async (req, res) => {
    const moviesArg = req.query.movies;

    if (!moviesArg) {
      res.status(400).send({
        success: false,
        message:
          'Must include the query param `movies` as an array of movie objects',
      });
      return;
    }

    let movies;
    try {
      movies = JSON.parse(moviesArg);
    } catch (e) {
      console.error(e);
      res.status(400).send({
        success: false,
        message:
          'Must include the query param `movies` as an array of movie objects, failed to JSON parse movies',
      });
      return;
    }

    if (!Array.isArray(movies)) {
      res.status(400).send({
        success: false,
        message:
          'Must include the query param `movies` as an array of movie objects, movies is not an array',
      });
      return;
    }

    if (
      !movies.every(
        ({ title, release_date }) => !!title && !!release_date,
      )
    ) {
      res.status(400).send({
        success: false,
        message: 'All movies must have a `title` and `release_date`',
      });
      return;
    }

    if (
      !movies.every(({ release_date }) => dateRegex.test(release_date))
    ) {
      res.status(400).send({
        success: false,
        message:
          '`release_date` must match ISO 8601 date string format',
      });
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
    const queries = [];

    const title = req.query.title;
    const releaseDate = req.query.release_date;
    const id = req.query.id;

    if (title) {
      queries.push({
        title: Array.isArray(title) ? { $in: title } : title,
      });
    }

    if (releaseDate) {
      queries.push({
        release_date: Array.isArray(releaseDate)
          ? { $in: releaseDate }
          : releaseDate,
      });
    }

    if (id) {
      queries.push({
        _id: Array.isArray(id)
          ? { $in: id.map((i) => new ObjectId(i)) }
          : new ObjectId(id),
      });
    }

    const filter = queries.length ? { $and: queries } : undefined;

    const result = await db.collection('movies').find(filter).toArray();

    res.json(result);
  });

  app.get('/remove', async (req, res) => {
    let filter;
    const id = req.query.id;
    if (id) {
      filter = {
        _id: Array.isArray(id)
          ? { $in: id.map((i) => new ObjectId(i)) }
          : new ObjectId(id),
      };
    }

    const result = await db.collection('movies').deleteMany(filter);

    res.json(result);
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

main();
