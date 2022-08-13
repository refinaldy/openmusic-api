const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const {
  mapDBPlaylistToModel,
  mapDBSongsInPlaylistToModel,
} = require('../../utils/index');
const InvariantError = require('../../exceptions/InvariantError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor(collaborationsService) {
    this._collaborationsService = collaborationsService;
    this._pool = new Pool();
  }

  async addPlaylist({name, owner}) {
    const id = 'playlist-' + nanoid(16);

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
      FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [userId],
    };

    const result = await this._pool.query(query);

    return result.rows.map(mapDBPlaylistToModel);
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Resource yang Anda minta tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async deletePlaylistById(id) {
    const query = {
      text: `DELETE FROM playlists WHERE id = $1 RETURNING id, owner`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist({songId, playlistId}) {
    const id = 'playlist-song' + nanoid(16);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: `SELECT 
    playlists.id , playlists.name, 
    users.username , 
    songs.id as songId, songs.title, songs.performer 
    FROM playlists 
    LEFT JOIN users ON users.id = playlists.owner 
    LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id 
    LEFT JOIN songs ON songs.id = playlist_songs.song_id 
    WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    const playlist = result.rows.map(mapDBPlaylistToModel)[0];
    let songs = [];

    if (result.rows[0].songid != null) {
      songs = result.rows.map(mapDBSongsInPlaylistToModel);
    }

    const playlistWithSongs = {
      ...playlist,
      songs: songs,
    };


    return playlistWithSongs;
  }

  async deleteSongByIdFromPlaylist({songId, playlistId}) {
    const query = {
      text: `DELETE 
      FROM playlist_songs 
      WHERE song_id = $1 AND playlist_id = $2 
      RETURNING id`,
      values: [songId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError(`
        Lagu gagal dihapus dari playlist. Id lagu tidak ditemukan`,
      );
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(
            playlistId, userId,
        );
      } catch {
        throw error;
      }
    }
  }
}


module.exports = PlaylistsService;
