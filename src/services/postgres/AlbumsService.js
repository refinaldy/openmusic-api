const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const {
  mapDBAlbumToModel,
} = require('../../utils/index');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({name, year}) {
    const id = 'album-' + nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    await this._cacheService.delete(`album:${result.rows[0].id}`);
    await this._cacheService.delete(`albums}`);

    return result.rows[0].id;
  }

  async getAlbums() {
    try {
      const result = await this._cacheService.get(`albums`);
      return {
        albums: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const result = await this._pool.query('SELECT * FROM albums');
      const mappedResult = result.rows.map(mapDBAlbumToModel);
      await this._cacheService.set(
          `albums`, JSON.stringify(mappedResult), 1800,
      );
      return {albums: mappedResult};
    }
  }

  async getSongInAlbum(albumId) {
    const query = {
      text: `SELECT id, title, performer FROM songs WHERE album_id = $1`,
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      return [];
    }

    return result.rows;
  }

  async getAlbumById(id) {
    try {
      const result = await this._cacheService.get(`album:${id}`);
      return {
        album: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const query = {
        text: `SELECT id, name, year, cover FROM albums WHERE id = $1`,
        values: [id],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const songs = await this.getSongInAlbum(id);

      const albumWithSongs = {
        ...result.rows.map(mapDBAlbumToModel)[0],
        songs: songs,
      };

      await this._cacheService.set(
          `album:${id}`, JSON.stringify(albumWithSongs), 1800,
      );

      return {album: albumWithSongs};
    }
  }

  async editAlbumById(id, {name, year}) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE albums 
              SET name = $1, 
              year = $2, 
              updated_at = $3
              WHERE id = $4 RETURNING id`,
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${result.rows[0].id}`);
    await this._cacheService.delete(`albums}`);

    return result.rows;
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${result.rows[0].id}`);
    await this._cacheService.delete(`albums}`);
  }

  async addAlbumCoverUrlById(id, coverUrl) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE albums 
              SET
              cover = $1, 
              updated_at = $2
              WHERE id = $3 RETURNING id`,
      values: [coverUrl, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${result.rows[0].id}`);
    await this._cacheService.delete(`albums}`);

    return result.rows;
  }

  async getTotalAlbumLikesByIdHandler(id) {
    try {
      const result = await this._cacheService.get(`album-likes:${id}`);
      return {
        likes: parseInt(JSON.parse(result)),
        cache: true,
      };
    } catch (error) {
      const query = {
        text: `SELECT COUNT(user_id) as likes
        FROM user_album_likes 
        WHERE album_id = $1`,
        values: [id],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
      }

      const {likes} = result.rows[0];
      const parsedIntLikes = parseInt(likes);

      await this._cacheService.set(
          `album-likes:${id}`, JSON.stringify(parsedIntLikes), 1800,
      );

      return {
        likes: parsedIntLikes,
      };
    }
  }

  async isUserAlreadyLikedAlbum(albumId, userId) {
    const query = {
      text: `SELECT id 
      FROM user_album_likes 
      WHERE album_id = $1 and user_id = $2`,
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    return !result.rows.length ? false : true;
  }

  async addLikeToAlbumById(albumId, userId) {
    const id = 'user-album-like' + nanoid(16);

    const query = {
      text: `INSERT INTO user_album_likes 
      VALUES($1, $2, $3) RETURNING id`,
      values: [id, userId, albumId],
    };

    await this._pool.query(query);
    await this._cacheService.delete(`album-likes:${albumId}`);
  }

  async undoLikeAlbumById(albumId, userId) {
    const query = {
      text: `DELETE 
      FROM user_album_likes 
      WHERE album_id = $1 AND user_id = $2`,
      values: [albumId, userId],
    };

    await this._pool.query(query);
    await this._cacheService.delete(`album-likes:${albumId}`);
  }
}


module.exports = AlbumsService;
