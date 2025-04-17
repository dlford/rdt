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
  type Training_Movies_Movie {
    _id: ID!
    title: String!
    release_date: String!
  }

  input Training_Movies_Insert_Input {
    title: String!
    release_date: String!
  }

  type Training_Movies_Insert_Response {
    success: Boolean!
    message: String!
  }

  input Training_Movies_Find_Input {
    id: ID
    title: String
    release_date: String
  }

  type Training_Movies_Find_Response {
    success: Boolean!
    message: String
    docs: [Training_Movies_Movie!]!
  }

  type Training_Movies_Remove_Response {
    success: Boolean!
    message: String!
  }

  type Training_Movies_Query {
    find(query: Training_Movies_Find_Input): Training_Movies_Find_Response!
  }

  type Training_Movies_Mutation {
    insert(movies: [Training_Movies_Insert_Input!]!): Training_Movies_Insert_Response!
    remove(ids: [ID]): Training_Movies_Remove_Response!
  }

  type Query {
    training: Training_Movies_Query
  }

  type Mutation {
    training: Training_Movies_Mutation
  }
`;

const resolvers = {
  Query: {
    training: () => ({}),
  },
  Mutation: {
    training: () => ({}),
  },
  Training_Movies_Query: {
    find: async (parent, args, ctx) => {
      const docs = await ctx.db.collection('movies').find().toArray();
      return {
        success: true,
        docs,
      };
    },
  },
  Training_Movies_Mutation: {
    insert: async (parent, args, ctx) => {
      return {
        success: false,
        message: 'not implemented',
      };
    },
    remove: async (parent, args, ctx) => {
      return {
        success: false,
        message: 'not implemented',
      };
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
