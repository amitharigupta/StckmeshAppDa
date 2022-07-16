const Sequelize = require('sequelize');

const sequelize = new Sequelize(config.database, config.db_username, config.db_password, {
    dialect: config.dialect,
    storage: config.path,
    // logging: msg => logging.db(msg),
    logging: console.log,
    dialectOptions: {
      timezone: config.time_zone,
      typeCast: function (field, next) { // for reading from database
        console.log(field)
        if (field.type === 'TIMESTAMP') {
          return '1'
        }
          return next()
        },
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
});

module.exports = sequelize