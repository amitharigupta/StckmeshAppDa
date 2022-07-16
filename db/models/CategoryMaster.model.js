const sequelize = require('../connection');
const Sequelize = require('sequelize');

var CategoryMaster = sequelize.define('category',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    categoryName: {
      type: Sequelize.STRING,
      default: null,
      allowNull: true
    },
    categoryPrefix: {
      type: Sequelize.STRING,
      default: null,
      allowNull: true
    }
  },
  {
    freezeTableName: true, // Model tableName will be the same as the model name
    paranoid: true, // adds deletedAt field on delete
  }
);

module.exports = CategoryMaster;