const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const {
  mapDBActivitiesToModel,
} = require('../../utils/index');

class ActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async addActivities(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: `INSERT INTO 
      playlist_song_activities 
      VALUES($1, $2, $3, $4, $5, $6) 
      RETURNING id`,
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Aktivitas gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getActivities(playlistId) {
    const query = {
      text: `SELECT 
      playlists.id, 
      users.username, 
      songs.title, 
      playlist_song_activities.action, 
      playlist_song_activities.time 
      FROM 
      playlist_song_activities 
      LEFT JOIN 
      playlists ON playlists.id = playlist_song_activities.playlist_id 
      LEFT JOIN 
      users ON users.id = playlist_song_activities.user_id 
      LEFT JOIN 
      songs ON songs.id = playlist_song_activities.song_id 
      WHERE playlist_song_activities.playlist_id = $1
      ORDER BY playlist_song_activities.time ASC
      `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    const playlistActivities = {
      playlistId,
      activities: result.rows.map(mapDBActivitiesToModel),
    };

    return playlistActivities;
  }
}

module.exports = ActivitiesService;
