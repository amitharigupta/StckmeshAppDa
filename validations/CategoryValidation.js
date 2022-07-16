const { required } = require('joi');
const Joi = require('joi');

module.exports = {
  createCategory: Joi.object().keys({
    categoryName: Joi.string().required().trim(),
    categoryPrefix: Joi.string().required().trim(),
  }),
  updateCategory: Joi.object().keys({
    categoryName: Joi.string().required().trim(),
    categoryPrefix: Joi.string().required().trim(),
  })
}
