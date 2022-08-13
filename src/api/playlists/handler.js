const ClientError = require('../../exceptions/ClientError');

class PlaylistsHandler {
  constructor(
      playlistService,
      songsService,
      activitiesService,
      validator) {
    this._playlistsService = playlistService;
    this._songsService = songsService;
    this._activitiesService = activitiesService;
    this._validator = validator;

    this.postPlaylistHandler =
      this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler =
      this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler =
      this.deletePlaylistByIdHandler.bind(this);
    this.assignSongToPlaylistHandler =
      this.assignSongToPlaylistHandler.bind(this);
    this.getPlaylistByIdHandler =
      this.getPlaylistByIdHandler.bind(this);
    this.deleteSongByIdFromPlaylistHandler =
      this.deleteSongByIdFromPlaylistHandler.bind(this);
    this.getActivitiesByPlaylistIdHandler =
    this.getActivitiesByPlaylistIdHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    try {
      this._validator.validatePlaylistPayload(request.payload);
      const {name} = request.payload;
      const {id: credentialId} = request.auth.credentials;

      const playlistId = await this._playlistsService.addPlaylist({
        name, owner: credentialId,
      });

      const response = h.response({
        status: 'success',
        message: 'Playlist berhasil ditambahkan',
        data: {
          playlistId,
        },
      });

      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getPlaylistsHandler(request, h) {
    const {id: credentialId} = request.auth.credentials;

    const playlists = await this._playlistsService.getPlaylists(credentialId);

    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });

    return response;
  }

  async deletePlaylistByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const {id: credentialId} = request.auth.credentials;
      await this._playlistsService.verifyPlaylistOwner(id, credentialId);
      await this._playlistsService.deletePlaylistById(id);

      return {
        status: 'success',
        message: 'Playlist berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async assignSongToPlaylistHandler(request, h) {
    try {
      this._validator.validateAssignSongToPlaylistPayload(request.payload);

      const {songId} = request.payload;
      const {playlistId} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._playlistsService.
          verifyPlaylistAccess(playlistId, credentialId);

      await this._songsService.
          getSongById(songId);

      await this._playlistsService.
          addSongToPlaylist({songId, playlistId});

      await this._activitiesService.
          addActivities(
              playlistId, songId, credentialId, 'add',
          );

      const response = h.response({
        status: 'success',
        message: 'Lagu berhasil ditambahkan ke playlist',
      });

      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getPlaylistByIdHandler(request, h) {
    try {
      const {playlistId} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._playlistsService.verifyPlaylistAccess(
          playlistId, credentialId,
      );

      const playlist = await this._playlistsService.getPlaylistById(
          playlistId,
      );

      const response = h.response({
        status: 'success',
        message: 'Lagu berhasil didapatkan',
        data: {
          playlist,
        },
      });

      response.code(200);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteSongByIdFromPlaylistHandler(request, h) {
    try {
      this._validator.validateDeleteSongFromPlaylistPayload(request.payload);
      const {playlistId} = request.params;
      const {id: credentialId} = request.auth.credentials;
      const {songId} = request.payload;

      await this._playlistsService.verifyPlaylistAccess(
          playlistId, credentialId,
      );

      await this._playlistsService.deleteSongByIdFromPlaylist(
          {songId, playlistId},
      );

      await this._activitiesService.addActivities(
          playlistId, songId, credentialId, 'delete',
      );

      return {
        status: 'success',
        message: 'Lagu berhasil dihapus dari playlist',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getActivitiesByPlaylistIdHandler(request, h) {
    try {
      const {playlistId} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._playlistsService.verifyPlaylistAccess(
          playlistId, credentialId,
      );

      const activities = await this._activitiesService.getActivities(
          playlistId,
      );


      const response = h.response({
        status: 'success',
        message: 'Lagu berhasil didapatkan',
        data: activities,
      });

      response.code(200);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = PlaylistsHandler;
