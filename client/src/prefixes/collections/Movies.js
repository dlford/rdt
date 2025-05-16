const {
  query,
  nullToUndefined,
} = require('@simpleview/sv-graphql-client');

class Movies {
  constructor({ name, graphUrl, graphServer }) {
    this._name = name;
    this._graphUrl = graphUrl;
    this._graphServer = graphServer;
  }

  async find({ input, fields, context, headers }) {
    context = context || this._graphServer.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        query FindMovies(
          $id: ObjectID
          $title: String
          $release_date: ISODateString
          $director_id: ObjectID
          $actor_id: ObjectID
        ) {
          training {
            movies {
              find(
                id: $id
                title: $title
                release_date: $release_date
                director_id: $director_id
                actor_id: $actor_id
              ) {
                ${fields}
              }
            }
          }
        }
      `,
      variables,
      headers,
      url: this._graphUrl,
    });

    const returnData = response.training.movies.find;

    nullToUndefined(returnData);

    return returnData;
  }

  async insert({ input, fields, context, headers }) {
    context = context || this._graphServer.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        mutation InsertMovies($movies: [Training_Movies_Insert_Input!]!) {
          training {
            movies {
              insert(movies: $movies) {
                ${fields}
              }
            }
          }
        }
      `,
      variables,
      headers,
      url: this._graphUrl,
    });

    const returnData = response.training.movies.insert;

    nullToUndefined(returnData);

    return returnData;
  }

  async remove({ input, fields, context, headers }) {
    context = context || this._graphServer.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        mutation RemoveMovies($ids: [ObjectID]) {
          training {
            movies {
              remove(ids: $ids) {
                ${fields}
              }
            }
          }
        }
      `,
      variables,
      headers,
      url: this._graphUrl,
    });

    const returnData = response.training.movies.remove;

    nullToUndefined(returnData);

    return returnData;
  }
}

module.exports = Movies;
