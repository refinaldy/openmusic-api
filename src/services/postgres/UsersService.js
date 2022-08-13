const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');
const {nanoid} = require('nanoid');
const bcrypt = require('bcrypt');

class UsersService {
  constructor(cacheService) {
    this._cacheService = cacheService;
    this._pool = new Pool();
  }

  async addUser({username, password, fullname}) {
    await this.verifyNewUsername(username);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError(
          'Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    try {
      const result = await this._cacheService.get(`user:${userId}`);
      return {
        user: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const query = {
        text: 'SELECT id, username, fullname FROM users WHERE id = $1',
        values: [userId],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('User tidak ditemukan');
      }

      await this._cacheService.set(
          `user:${userId}`,
          JSON.stringify(result.rows[0]),
          259200,
      );

      return {user: result.rows[0]};
    }
  }

  async verifyUserCredential(username, password) {
    try {
      const result = await this._cacheService.get(`user:${username}`);

      const parsedResult = JSON.parse(result);
      const {id, password: hassedPassword} = parsedResult;
      const match = await bcrypt.compare(password, hassedPassword);
      if (!match) {
        throw new AuthenticationError('Kredensial yang anda berikan salah');
      }

      return {
        userId: id,
      };
    } catch (error) {
      const query = {
        text: 'SELECT id, password FROM users WHERE username = $1',
        values: [username],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah');
      }

      const {id, password: hashedPassword} = result.rows[0];

      const match = await bcrypt.compare(password, hashedPassword);

      if (!match) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah');
      }
      console.log(id);

      await this._cacheService.set(
          `user:${username}`,
          JSON.stringify(result.rows[0]),
          259200,
      );

      return {userId: id};
    }
  }
}

module.exports = UsersService;
