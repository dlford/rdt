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

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res
    .status(500)
    .json({ success: false, message: 'An unknown error occured' });
}

async function runMigrations(db) {
  await db.createCollection('movies');
}

// ISO 8601 date string
const dateRegex = /^\d{4}-([0][1-9]|1[0-2])-([0][1-9]|[1-2]\d|3[01])$/;

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
    find(id: ID, title: String, release_date: String): Training_Movies_Find_Response!
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
      const queries = [];

      const { title, release_date, id } = args;

      if (id) {
        try {
          queries.push({
            _id: new ObjectId(id),
          });
        } catch (e) {
          console.error(e);
          return {
            success: false,
            message: 'invalid `id` in query',
            docs: [],
          };
        }
      }

      if (title) {
        queries.push({
          title,
        });
      }

      if (release_date) {
        if (!dateRegex.test(release_date)) {
          return {
            success: false,
            message: 'invalid `release_date` in query',
            docs: [],
          };
        }

        queries.push({
          release_date,
        });
      }

      const filter = queries.length ? { $or: queries } : undefined;

      try {
        const docs = await ctx.db
          .collection('movies')
          .find(filter)
          .toArray();
        return {
          success: true,
          docs,
        };
      } catch (e) {
        console.error(e);
        return {
          success: false,
          message: 'An unknown error has occured',
        };
      }
    },
  },
  Training_Movies_Mutation: {
    insert: async (parent, args, ctx) => {
      const { movies } = args;

      if (!movies.length) {
        return {
          success: false,
          message: 'No movies provided',
        };
      }

      let errors = [];
      movies.forEach((movie) => {
        if (!movie.title) {
          errors.push(
            `"Movie missing required field \`title\`: \`${JSON.stringify(
              movie,
            )}\`"`,
          );
        }

        if (!movie.release_date) {
          errors.push(
            `"Movie missing required field \`release_date\`: \`${JSON.stringify(
              movie,
            )}\`"`,
          );
        }

        if (
          !!movie.release_date &&
          !dateRegex.test(movie.release_date)
        ) {
          errors.push(
            `"Movie has invalid \`release_date\`, must match ISO 8601 date string format: \`${JSON.stringify(
              movie,
            )}\`"`,
          );
        }
      });

      if (errors.length) {
        return {
          success: false,
          message: `Added 0 movies due to one or more errors: ${errors.join(
            ', ',
          )}`,
        };
      }

      try {
        await ctx.db.collection('movies').insertMany(movies);

        return {
          success: true,
          message: `Added movies: ${movies
            .reduce((acc, cur) => {
              return [...acc, cur.title];
            }, [])
            .join(', ')}`,
        };
      } catch (e) {
        console.error(e);
        return {
          success: false,
          message: 'An unknown error has occured',
        };
      }
    },
    remove: async (parent, args, ctx) => {
      const { ids } = args;

      let filter;
      let objIds = [];
      let errors = [];
      if (ids && ids.length) {
        ids.forEach((id) => {
          try {
            objIds.push(new ObjectId(id));
          } catch (e) {
            console.error(e);
            errors.push(id);
            return {
              success: false,
              message: `Invalid ID: ${id}`,
            };
          }
        });

        if (errors.length) {
          return {
            success: false,
            message: `One or more invalid IDs: ${errors.join(', ')}`,
          };
        }

        filter = {
          _id: { $in: objIds },
        };
      }

      try {
        const result = await ctx.db
          .collection('movies')
          .deleteMany(filter);

        const { deletedCount } = result;

        return {
          success: deletedCount !== 0,
          message: `Deleted ${deletedCount} ${
            deletedCount === 1 ? 'movie' : 'movies'
          }`,
        };
      } catch (e) {
        console.error(e);
        return {
          success: false,
          message: 'An unknown error has occured',
        };
      }
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

app.use(errorHandler);

app.listen(port, () => {
  console.log(`GraphQL listening on port ${port}!`);
});
