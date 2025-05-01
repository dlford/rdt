import svGraphQLClient from '@simpleview/sv-graphql-client';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import express from 'express';

const { schemaLoader } = svGraphQLClient;

const startTime = Date.now();

const app = express();

const port = process.env.RDT_GRAPHQL_PORT || 4000;
const dbUrl = process.env.RDT_GRAPHQL_DB_URL || 'mongodb://mongo:27017';
const dbName = process.env.RDT_GRAPHQL_DB_NAME || 'rdt';

const dbClient = new MongoClient(dbUrl);

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    if (res.headersSent) {
      return next(err);
    }

    return res
      .status(500)
      .json({ success: false, message: err.toString() });
  }

  console.error(err);

  if (res.headersSent) {
    return next(new Error('An unknown error occured'));
  }

  res
    .status(500)
    .json({ success: false, message: 'An unknown error occured' });
}

async function runMigrations(db) {
  await db.createCollection('movies');
  await db.createCollection('people');
}

const schema = await schemaLoader({
  paths: ['/app/lib/graphql'],
});

const server = new ApolloServer({
  schema,
});
await server.start();

app.get('/status', (req, res) => {
  res.json({
    start: startTime,
  });
});

app.use(
  '/',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async () => {
      await dbClient.connect((err) => {
        if (err) throw err;
      });

      process.on('exit', async () => {
        await dbClient.close();
      });

      const db = dbClient.db(dbName);

      await runMigrations(db);

      return {
        dbMovies: db.collection('movies'),
        dbPeople: db.collection('people'),
      };
    },
  }),
);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`GraphQL listening on port ${port}!`);
});
