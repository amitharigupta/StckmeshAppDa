const sequelize = require('./connection');
const Sequelize = require('sequelize');

// import all models
const Design = require('./models/Design.model')

// creating tables and default records
sequelize.sync({ force: false }).then(async() => {
    try{
        // ----- Create superadmin role -----
        // let test = await Design.findOrCreate({
        //     where: {
        //         name: 'Super Admin'
        //     },
        //     defaults: {
        //         name: 'Super Admin',
        //     } 
        // });
        // console.log(test)
        // logging.info('Role created')

    }
    catch(err){
        console.error(err)
    }
})

