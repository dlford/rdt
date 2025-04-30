import svMongoGraphQLUtils from '@simpleview/sv-mongo-graphql-utils';
import { GraphQLScalarType, Kind } from 'graphql';

const { scalarObjectId } = svMongoGraphQLUtils;

// ISO 8601 date string
const dateRegex = /^\d{4}-([0][1-9]|1[0-2])-([0][1-9]|[1-2]\d|3[01])$/;

export const typeDefs = `#graphql
  scalar ObjectID
  scalar ISODateString

  type Query {
    training: Training_Movies_Query
  }

  type Mutation {
    training: Training_Movies_Mutation
  }
`;

export const resolvers = {
  Query: {
    training: () => ({}),
  },
  Mutation: {
    training: () => ({}),
  },
  ObjectID: scalarObjectId('ObjectID'),
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
};
