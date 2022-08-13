const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(albumsService, albumCoverStorageService, validator) {
    this._albumsService = albumsService;
    this._albumCoverStorageService = albumCoverStorageService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postAlbumCoverHandler = this.postAlbumCoverHandler.bind(this);
    this.postLikeOrUnlikeAlbumHandler =
        this.postLikeOrUnlikeAlbumHandler.bind(this);
    this.getTotalLikesFromAlbumByIdHandler =
        this.getTotalLikesFromAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);
      const {name = 'untitled', year} = request.payload;

      const albumId = await this._albumsService.addAlbum({name, year});

      const response = h.response({
        status: 'success',
        message: 'Album berhasil ditambahkan',
        data: {
          albumId,
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

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumsHandler() {
    const {albums, cache} = await this._albumsService.getAlbums();

    const response = h.response({
      status: 'success',
      data: {
        albums,
      },
    });

    if (cache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const {album, cache} = await this._albumsService.
          getAlbumById(id);

      const response = h.response({
        status: 'success',
        data: {
          album,
        },
      });

      if (cache) {
        response.header('X-Data-Source', 'cache');
      }

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

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putAlbumByIdHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);
      const {id} = request.params;
      const album = await this._albumsService.editAlbumById(
          id, request.payload,
      );

      return {
        status: 'success',
        message: 'Album berhasil diperbarui',
        data: {
          album,
        },
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

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteAlbumByIdHandler(request, h) {
    try {
      const {id} = request.params;

      await this._albumsService.deleteAlbumById(id);

      return {
        status: 'success',
        message: 'Album berhasil dihapus',
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

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postAlbumCoverHandler(request, h) {
    try {
      const {id} = request.params;
      const {cover} = request.payload;
      this._validator.validateAlbumCoverHeadersPayload(cover.hapi.headers);

      await this._albumsService.getAlbumById(id);

      const filename = await this._albumCoverStorageService.writeFile(
          cover, cover.hapi,
      );

      const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/cover/${filename}`;

      await this._albumsService.addAlbumCoverUrlById(id, coverUrl);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
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

      // Server Error !

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });

      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postLikeOrUnlikeAlbumHandler(request, h) {
    try {
      const {id} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._albumsService.getAlbumById(id);

      const isUserAlreadyLikedAlbum =
        await this._albumsService.isUserAlreadyLikedAlbum(id, credentialId);

      let message = ``;
      if (isUserAlreadyLikedAlbum) {
        await this._albumsService.undoLikeAlbumById(id, credentialId);
        message = 'Batal menyukai album';
      } else {
        await this._albumsService.addLikeToAlbumById(id, credentialId);
        message = 'Berhasil menyukai album';
      }

      const response = h.response({
        status: 'success',
        message: message,
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

      // Server Error !

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });

      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getTotalLikesFromAlbumByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const {likes, cache} = await this._albumsService.
          getTotalAlbumLikesByIdHandler(id);

      const response = h.response({
        status: 'success',
        data: {
          likes,
        },
      });

      if (cache) {
        response.header('X-Data-Source', 'cache');
      }

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

      // Server Error !

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

module.exports = AlbumsHandler;
