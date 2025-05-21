const {
  query,
  nullToUndefined,
} = require('@simpleview/sv-graphql-client');

class People {
  constructor({ name, graphUrl, graphServer }) {
    this._name = name;
    this._graphUrl = graphUrl;
    this._graphServer = graphServer;
  }

  async find({ input, fields, context, headers }) {
    context = context || this?._graphServer?.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        query FindPeople($id: ObjectID, $first_name: String, $last_name: String) {
          training {
            people {
              find(id: $id, first_name: $first_name, last_name: $last_name) {
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

    const returnData = response.training.people.find;

    nullToUndefined(returnData);

    return returnData;
  }

  async insert({ input, fields, context, headers }) {
    context = context || this?._graphServer?.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        mutation InsertPeople($people: [Training_People_Insert_Input!]!) {
          training {
            people {
              insert(people: $people) {
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

    const returnData = response.training.people.insert;

    nullToUndefined(returnData);

    return returnData;
  }

  async remove({ input, fields, context, headers }) {
    context = context || this?._graphServer?.context;

    const variables = {
      ...input,
    };

    const response = await query({
      query: `
        mutation RemovePeople($ids: [ObjectID]) {
          training {
            people {
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

    const returnData = response.training.people.remove;

    nullToUndefined(returnData);

    return returnData;
  }
}

module.exports = People;
