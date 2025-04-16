import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

const startTime = Date.now();

const app = express();
const port = process.env.RDT_GRAPHQL_PORT || 4000;

const typeDefs = `#graphql
  type Status {
    start: Float
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
    books: () => books,
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

app.use('/', cors(), express.json(), expressMiddleware(server));

app.listen(port, () => {
  console.log(`GraphQL listening on port ${port}!`);
});
