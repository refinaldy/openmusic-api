const InvariantError = require('../../exceptions/InvariantError');
const {AlbumPayloadSchema, AlbumCoverHeaderSchema} = require('./schema');

const AlbumsValidator = {
  validateAlbumPayload: (payload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateAlbumCoverHeadersPayload: (headers) => {
    const validationResult = AlbumCoverHeaderSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AlbumsValidator;
