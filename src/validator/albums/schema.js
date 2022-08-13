const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});


const AlbumCoverHeaderSchema = Joi.object({
  'content-type': Joi.string().valid(
      'image/jpeg',
      'iamge/apng',
      'image/avif',
      'image/gif',
      'image/png',
      'image/webp',
  ).required(),
}).unknown();


module.exports = {AlbumPayloadSchema, AlbumCoverHeaderSchema};
