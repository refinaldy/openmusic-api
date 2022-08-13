const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');


class AuthenticationsService {
  constructor(cacheService) {
    this._cacheService = cacheService;
    this._pool = new Pool();
  }

  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await this._pool.query(query);
    await this._cacheService.set(
        `refreshToken:${token}`,
        JSON.stringify(token),
        604800,
    );
  }

  async verifyRefreshToken(token) {
    try {
      await this._cacheService.get(`refreshToken:${token}`);
    } catch (error) {
      const query = {
        text: 'SELECT token FROM authentications WHERE token = $1',
        values: [token],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new InvariantError('Refresh token tidak valid');
      }

      await this._cacheService.set(
          `refreshToken:${token}`,
          JSON.stringify(token),
          604800,
      );
    }
  }

  async deleteRefreshToken(token) {
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };
    await this._pool.query(query);
    await this._cacheService.delete(
        `refreshToken:${token}`,
    );
  }
}

module.exports = AuthenticationsService;
