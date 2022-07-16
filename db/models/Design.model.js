const sequelize = require('../connection');
const Sequelize = require('sequelize');

var Design = sequelize.define('design',
    {
        id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, unique: true, primaryKey: true },
        categoryId: { type: Sequelize.INTEGER, allowNull: false },
        skuNumber: { type: Sequelize.STRING, allowNull: true, default: null },
        designNumber: { type: Sequelize.STRING, allowNull: true, default: null },
        imageName: { type: Sequelize.STRING, allowNull: true, default: null },
        itemStatus: { type: Sequelize.STRING, allowNull: true, default: null },
        itemType: { type: Sequelize.STRING, allowNull: true, default: null },
        grossWt: { type: Sequelize.STRING, allowNull: true, default: null },
        stoneWt: { type: Sequelize.STRING, allowNull: true, default: null },
        beadWt: { type: Sequelize.STRING, allowNull: true, default: null },
        extraStoneWt: { type: Sequelize.STRING, allowNull: true, default: null },
        totalStoneWt: { type: Sequelize.STRING, allowNull: true, default: null },
        seventyStoneWt: { type: Sequelize.STRING, allowNull: true, default: null },
        netWt: { type: Sequelize.STRING, allowNull: true, default: null },
        metalType: { type: Sequelize.STRING, allowNull: true, default: null },
        purity: { type: Sequelize.STRING, allowNull: true, default: null },
        code: { type: Sequelize.STRING, allowNull: true, default: null },
        color: { type: Sequelize.STRING, allowNull: true, default: null },
        totalDiamondWeight: { type: Sequelize.STRING, allowNull: true, default: null },
        stoneCount: { type: Sequelize.STRING, allowNull: true, default: null },
        stoneWeight: { type: Sequelize.STRING, allowNull: true, default: null },
        totalStoneCount: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved1: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved2: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved3: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved4: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved5: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved6: { type: Sequelize.STRING, allowNull: true, default: null },
        reserved7: { type: Sequelize.STRING, allowNull: true, default: null },
        colourStoneWeight: { type: Sequelize.STRING, allowNull: true, default: null },
        huid: { type: Sequelize.STRING, allowNull: true, default: null }
    },
    {
        freezeTableName: true, // Model tableName will be the same as the model name
        paranoid: true, // adds deletedAt field on delete
    }
);

module.exports = Design