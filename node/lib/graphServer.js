const { TrainingPrefix } = require('@simpleview/rd-training-client');

const gqlUrl = process.env.RDT_NODE_GQL_URL || 'http://graphql:4000';

module.exports = new TrainingPrefix({ graphUrl: gqlUrl });
