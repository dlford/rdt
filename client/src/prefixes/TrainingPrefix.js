const Movies = require('./collections/Movies');

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
}

module.exports = TrainingPrefix;
