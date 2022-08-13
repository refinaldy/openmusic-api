const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {
    albumsService,
    albumCoverStorageService,
    validator}) => {
    const albumsHandler = new AlbumsHandler(
        albumsService,
        albumCoverStorageService,
        validator);
    server.route(routes(albumsHandler));
  },
};
