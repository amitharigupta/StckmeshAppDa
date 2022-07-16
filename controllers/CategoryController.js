const CategoryModel = require('../models/CategoryModel')
const DesignModel = require('../models/DesignModel')
const responseUtils = require('../utils/response.utils')
const { Op } = require("sequelize")
const sequelize = require("sequelize")

function trimObject(obj) {
  Object.entries(obj).forEach(data => {
    if (typeof data[1] == 'string')
      obj[data[0]] = data[1].trim()
  })
}

module.exports = {
  createCategory: async (req, res, next) => {
    try {
      trimObject(req.body)
      let { categoryName, categoryPrefix } = req.body
      let query1 = sequelize.where(sequelize.fn('lower', sequelize.col('categoryName')), { [Op.like]: categoryName });
      let query2 = sequelize.where(sequelize.fn('lower', sequelize.col('categoryName')), { [Op.like]: categoryName });
      let categoryExists = await CategoryModel.getCategory({ [Op.or]: [ query1, query2 ] })
      if (categoryExists)
        return res.json(responseUtils.message(false, 'Category Name or Prefix already exists'));
      let category = await CategoryModel.createCategory({ categoryName, categoryPrefix });
      return res.json(responseUtils.success(category, 'Category created successfully'));
    }
    catch (err) {
      return next(err)
    }
  },
  getAllCategorys: async (req, res, next) => {
    try {
      let Category = await CategoryModel.getAllCategorys()
      if (Category.rows.length > 0)
        return res.json(responseUtils.success(Category, 'Categorys fetched successfully'));
      else
        return res.json(responseUtils.message(false, 'No Categorys found'));
    }
    catch (err) {
      return next(err)
    }
  },
  updateCategory: async (req, res, next) => {
    try {
      trimObject(req.body)
      let { categoryName, categoryPrefix } = req.body
      let { id } = req.params
      let query1 = sequelize.where(sequelize.fn('lower', sequelize.col('categoryName')), { [Op.like]: categoryName })
      let query2 = sequelize.where(sequelize.fn('lower', sequelize.col('categoryName')), { [Op.like]: categoryPrefix })
      let categoryExists = await CategoryModel.getCategory({ 'id': { [Op.ne]: parseInt(id) }, [Op.or]: [query1, query2] })
      if (categoryExists)
        return res.json(responseUtils.message(false, 'Category Name or Prefix already exists'));

      let updateCategory = await CategoryModel.updateCategoryById(id, { categoryName, categoryPrefix })
      if (updateCategory > 0)
        return res.json(responseUtils.message(true, 'Category updated successfully'));
      else
        return res.json(responseUtils.message(false, 'Category not found'));
    } catch (err) {
      return next(err)
    }
  },
  deleteCategory: async (req, res, next) => {
    const id = req.params.id;
    try {
      let checkDesignExists = await DesignModel.checkDesignExists({ 'categoryId': id })
      if(checkDesignExists > 0) return res.json(responseUtils.message(false, 'Category is already in Designs table'))
      let deleteCategory = await CategoryModel.deleteCategoryById(id)
      if (deleteCategory > 0)
        return res.json(responseUtils.message(true, 'Category deleted successfully'));
      else
        return res.json(responseUtils.message(false, 'Category not found'));
    }
    catch (err) {
      return next(err)
    }
  }
}