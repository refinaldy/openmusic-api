const mapDBAlbumToModel = ({id, name, year, cover}) => ({
  id,
  name,
  year,
  coverUrl: cover ?? null,
});

const mapDBSongToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  // eslint-disable-next-line camelcase
  album_id}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  // eslint-disable-next-line camelcase
  albumId: album_id});

const mapDBPlaylistToModel = ({id, name, username}) => ({
  id,
  name,
  username,
});

const mapDBSongsInPlaylistToModel = ({songid, title, performer}) => ({
  id: songid,
  title,
  performer,
});

const mapDBActivitiesToModel = ({username, title, action, time}) => ({
  username,
  title,
  action,
  time,
});


module.exports = {
  mapDBAlbumToModel,
  mapDBSongToModel,
  mapDBPlaylistToModel,
  mapDBSongsInPlaylistToModel,
  mapDBActivitiesToModel,
};
