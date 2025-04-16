import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import express from 'express';

const startTime = Date.now();

const app = express();

const port = process.env.RDT_GRAPHQL_PORT || 4000;
const dbUrl = process.env.RDT_GRAPHQL_DB_URL || 'mongodb://mongo:27017';
const dbName = process.env.RDT_GRAPHQL_DB_NAME || 'rdt';

const dbClient = new MongoClient(dbUrl);

async function runMigrations(db) {
  await db.createCollection('movies');
}

const typeDefs = `#graphql
  type Status {
    start: Float
  }

  type Training_Movies_Movie {
    id: String
    title: String
    release_date: String
  }

  type Book {
    title: String
    author: String
  }

  type Query {
    status: Status
    books: [Book]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const resolvers = {
  Query: {
    status: () => ({
      start: startTime,
    }),
    books: async (parent, args, ctx) => {
      // TODO: Delete test
      const movies = await ctx.db.collection('movies').find().toArray();
      console.log(movies);
      return books;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
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

      return { db };
    },
  }),
);

app.listen(port, () => {
  console.log(`GraphQL listening on port ${port}!`);
});
