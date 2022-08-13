const InvariantError = require('../../exceptions/InvariantError');
const {
  PlaylistPayloadSchema,
  AssignSongToPlaylistPayloadSchema,
  DeleteSongFromPlaylistPayloadSchema,
} = require('./schema');

const PlaylistsValidator = {
  validatePlaylistPayload: (payload) => {
    const validationResult = PlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateAssignSongToPlaylistPayload: (payload) => {
    const validationResult =
    AssignSongToPlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateDeleteSongFromPlaylistPayload: (payload) => {
    const validationResult =
    DeleteSongFromPlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = PlaylistsValidator;
