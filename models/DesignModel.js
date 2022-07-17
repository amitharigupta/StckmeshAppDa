const Design = require('../db/models/Design.model')
const Category = require('../db/models/CategoryMaster.model')
const { Op } = require("sequelize");

module.exports = {
    createDesign: async (obj) => {
        try {
            let design = await Design.create(obj);
            return design
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    updateDesignById: async (id, obj) => {
        try {
            let design = await Design.update(obj, { 'where': { 'id': id } });
            return design[0]    // return update count
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    deleteDesignById: async (id) => {
        try {
            let design = await Design.destroy({ 'where': { 'id': id } });
            return design    // return delete count
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    getDesign: async (query) => {
        try {
            let design = await Design.findOne({ 'where': query });
            return design
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    getDesigns: async (query) => {
        try {
            let design = await Design.findAll({ 'where': query });
            return design
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    getAllDesigns: async (page, limit) => {
        try {
            let query = {
                'order': ['createdAt'],
                where: { 'deletedAt': null }
            }
            if (page && limit) {
                query['offset'] = (page * limit) - limit;
                query['limit'] = parseInt(limit);
            }
            let designs = await Design.findAndCountAll(query);
            return designs
        }
        catch (err) {
            return Promise.reject(err)
        }
    },
    getDesignByNumber: async (query) => {
        try {
            let design = await Design.findOne({ where: query });
            return design
        } catch (exception) {
            return Promise.reject(err)
        }
    },
    getDesignNumberCount: async (categoryId) => {
        try {
            let count = await Design.count({ where: { categoryId } });
            return count
        } catch (exception) {
            return Promise.reject(err)
        }
    },
    checkDesignExists: async (payload) => {
        try {
            let designs = await Design.count({
                'where': payload,
            });
            return designs
        } catch (err) {
            return Promise.reject(err)
        }
    },
    getDesignsWithCategory: async (payload) => {
        try {
            let design = await Design.findAll({
                'where': payload,
                'include': [
                    { model: Category, as: 'category', attributes: ['id', 'categoryName', 'categoryPrefix'] }
                ]
            })
            return design
        } catch (err) {
            return Promise.reject(err)
        }
    },
    getDesignsByGrWt: async (payload) => {
        try {
            let designs = await Design.findAll({ 'where': payload })
            return designs
        } catch (err) {
            return Promise.reject(err)
        }
    }
}