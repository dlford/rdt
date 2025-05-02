import svMongoGraphQLUtils from '@simpleview/sv-mongo-graphql-utils';

const { graphqlHelpers } = svMongoGraphQLUtils;

export const typeDefs = `#graphql
  type Training_People_Person {
    id: ObjectID!
    first_name: String!
    last_name: String!
    directed: [Training_Movies_Movie]
    acted_in: [Training_Movies_Movie]
  }

  input Training_People_Insert_Input {
    first_name: String!
    last_name: String!
  }

  type Training_People_Insert_Response {
    success: Boolean!
    message: String!
  }

  type Training_People_Find_Response {
    success: Boolean!
    message: String
    docs: [Training_People_Person!]!
  }

  type Training_People_Remove_Response {
    success: Boolean!
    message: String!
  }

  type Training_People_Query {
    find(id: ObjectID, title: String, release_date: ISODateString): Training_People_Find_Response!
  }

  type Training_People_Mutation {
    insert(people: [Training_People_Insert_Input!]!): Training_People_Insert_Response!
    remove(ids: [ObjectID]): Training_People_Remove_Response!
  }
`;

export const resolvers = {
  Training_Query: {
    people: () => ({}),
  },
  Training_Mutation: {
    people: () => ({}),
  },
  Training_People_Person: {
    id: graphqlHelpers.mapKeyResolver('_id'),
    directed: async (parent, args, ctx) => {
      const directedQ = await ctx.dbMovies
        .find({
          director_id: parent._id,
        })
        .toArray();

      if (directedQ.length) {
        return directedQ;
      }

      return null;
    },
    acted_in: async (parent, args, ctx) => {
      const actorQ = await ctx.dbMovies
        .find({
          actor_ids: parent._id,
        })
        .toArray();

      if (actorQ.length) {
        return actorQ;
      }

      return null;
    },
  },
  Training_People_Query: {
    find: async (parent, args, ctx) => {
      const queries = [];

      const { first_name, last_name, id } = args;

      if (id) {
        queries.push({
          _id: id,
        });
      }

      if (first_name) {
        queries.push({
          first_name,
        });
      }

      if (last_name) {
        queries.push({
          last_name,
        });
      }

      const filter = queries.length ? { $or: queries } : undefined;

      const docs = await ctx.dbPeople.find(filter).toArray();
      return {
        success: true,
        docs,
      };
    },
  },
  Training_People_Mutation: {
    insert: async (parent, args, ctx) => {
      const { people } = args;

      if (!people.length) {
        throw new Error('No people provided');
      }

      let errors = [];
      people.forEach((person) => {
        if (!person.first_name) {
          errors.push(
            `"Person missing required field \`first_name\`: \`${JSON.stringify(
              person,
            )}\`"`,
          );
        }

        if (!person.last_name) {
          errors.push(
            `"Person missing required field \`last_name\`: \`${JSON.stringify(
              person,
            )}\`"`,
          );
        }
      });

      if (errors.length) {
        throw new Error(
          `Added 0 people due to one or more errors: ${errors.join(
            ', ',
          )}`,
        );
      }

      await ctx.dbPeople.insertMany(people);

      return {
        success: true,
        message: `Added people: ${people
          .reduce((acc, cur) => {
            return [...acc, `${cur.first_name} ${cur.last_name}`];
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

      const result = await ctx.dbPeople.deleteMany(filter);

      const { deletedCount } = result;

      return {
        success: true,
        message: `Deleted ${deletedCount} ${
          deletedCount === 1 ? 'person' : 'people'
        }`,
      };
    },
  },
};
