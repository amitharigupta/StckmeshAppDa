const Category = require('../db/models/CategoryMaster.model')
const { Op } = require("sequelize");
const sequelize = require('sequelize');

module.exports = {
  createCategory: async (obj) => {
    try {
      let category = await Category.create(obj);
      return category
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  updateCategoryById: async (id, obj) => {
    try {
      let category = await Category.update(obj, { 'where': { 'id': id } });
      return category[0]    // return update count
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  deleteCategoryById: async (id) => {
    try {
      let category = await Category.destroy({ 'where': { 'id': id } });
      return category    // return delete count
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  getCategory: async (query) => {
    try {
      let category = await Category.findOne({ 'where': query });
      return category
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  getCategorys: async (query) => {
    try {
      let Category = await Category.findAll({ 'where': query });
      return Category
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  getAllCategorys: async (page, limit) => {
    try {
      let query = {
        'order': [['createdAt', 'desc']],
        where: { 'deletedAt': null }
      }
      let categorys = await Category.findAndCountAll(query);
      return categorys
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
  getDistinctCategorys: async (query, attr) => {
    try {
      let brand = await Category.findAll({ attributes: attr, 'where': query });
      return brand
    }
    catch (err) {
      return Promise.reject(err)
    }
  },
}