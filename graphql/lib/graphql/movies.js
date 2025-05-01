import svMongoGraphQLUtils from '@simpleview/sv-mongo-graphql-utils';

const { graphqlHelpers } = svMongoGraphQLUtils;

export const typeDefs = `#graphql
  type Training_Movies_Movie {
    id: ObjectID!
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
`;

export const resolvers = {
  Query: {
    training: () => ({
      movies: () => ({}),
    }),
  },
  Mutation: {
    training: () => ({
      movies: () => ({}),
    }),
  },
  Training_Movies_Movie: {
    id: graphqlHelpers.mapKeyResolver('_id'),
  },
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
