import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { GraphQLScalarType, Kind } from 'graphql';
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
  if (process.env.NODE_ENV !== 'production') {
    res.status(500).json({ success: false, message: err.toString() });
  }

  if (res.headersSent) {
    return next(new Error('An unknown error occured'));
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
  scalar ObjectID
  scalar ISODateString

  type Training_Movies_Movie {
    _id: ObjectID!
    title: String!
    release_date: ISODateString!
  }

  input Training_Movies_Insert_Input {
    title: String!
    release_date: ISODateString!
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
    find(id: ObjectID, title: String, release_date: ISODateString): Training_Movies_Find_Response!
  }

  type Training_Movies_Mutation {
    insert(movies: [Training_Movies_Insert_Input!]!): Training_Movies_Insert_Response!
    remove(ids: [ObjectID]): Training_Movies_Remove_Response!
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
  ObjectID: new GraphQLScalarType({
    name: 'ObjectID',
    description: 'MongoDB BSON ObjectId',
    serialize(value) {
      console.log(value);
      return value.toString();
    },
    parseValue(value) {
      if (typeof value === 'string' && ObjectId.isValid(value)) {
        return new ObjectId(value);
      }
      throw new Error('Not a valid ID');
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING && ObjectId.isValid(ast.value)) {
        return new ObjectId(ast.value);
      }
      throw new Error('Not a valid ID');
    },
  }),
  ISODateString: new GraphQLScalarType({
    name: 'ISODateString',
    description:
      'ISO 8601 date string (without time, e.g. `2025-01-01`)',
    serialize(value) {
      return value;
    },
    parseValue(value) {
      if (typeof value === 'string' && dateRegex.test(value)) {
        return value;
      }
      throw new Error('Not a valid ISO 8601 date string');
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING && dateRegex.test(ast.value)) {
        return ast.value;
      }
      throw new Error('Not a valid ISO 8601 date string');
    },
  }),
  Training_Movies_Query: {
    find: async (parent, args, ctx) => {
      const queries = [];

      const { title, release_date, id } = args;

      if (id) {
        queries.push({
          _id: id,
        });
      }

      if (title) {
        queries.push({
          title,
        });
      }

      if (release_date) {
        queries.push({
          release_date,
        });
      }

      const filter = queries.length ? { $or: queries } : undefined;

      const docs = await ctx.dbMovies.find(filter).toArray();
      return {
        success: true,
        docs,
      };
    },
  },
  Training_Movies_Mutation: {
    insert: async (parent, args, ctx) => {
      const { movies } = args;

      if (!movies.length) {
        throw new Error('No movies provided');
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
      });

      if (errors.length) {
        throw new Error(
          `Added 0 movies due to one or more errors: ${errors.join(
            ', ',
          )}`,
        );
      }

      await ctx.dbMovies.insertMany(movies);

      return {
        success: true,
        message: `Added movies: ${movies
          .reduce((acc, cur) => {
            return [...acc, cur.title];
          }, [])
          .join(', ')}`,
      };
    },
    remove: async (parent, args, ctx) => {
      const { ids } = args;

      let filter;
      if (ids && ids.length) {
        filter = {
          _id: { $in: ids },
        };
      }

      const result = await ctx.dbMovies.deleteMany(filter);

      const { deletedCount } = result;

      return {
        success: true,
        message: `Deleted ${deletedCount} ${
          deletedCount === 1 ? 'movie' : 'movies'
        }`,
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

      return { dbMovies: db.collection('movies') };
    },
  }),
);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`GraphQL listening on port ${port}!`);
});
