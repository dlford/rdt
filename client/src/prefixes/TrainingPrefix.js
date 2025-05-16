const Movies = require('./collections/Movies');
const People = require('./collections/People');

class TrainingPrefix {
  constructor({ graphUrl, graphServer }) {
    this.name = 'training';

    this._graphUrl = graphUrl;
    this._graphServer = graphServer;

    this._movies = new Movies({
      name: 'movies',
      graphUrl,
      graphServer,
    });

    this._people = new People({
      name: 'people',
      graphUrl,
      graphServer,
    });
  }

  async find_movies(...args) {
    return this._movies.find(...args);
  }

  async insert_movies(...args) {
    return this._movies.insert(...args);
  }

  async remove_movies(...args) {
    return this._movies.remove(...args);
  }

  async find_people(...args) {
    return this._people.find(...args);
  }

  async insert_people(...args) {
    return this._people.insert(...args);
  }

  async remove_people(...args) {
    return this._people.remove(...args);
  }
}

module.exports = TrainingPrefix;
