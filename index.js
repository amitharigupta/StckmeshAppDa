// setting project env
const env = process.env.NODE_ENV || 'local';
const path = require('path')
global.env = env
global.config = require('./environment/local')

// import for global winston logging
global.logging = require('./utils/logging.utils.js')()
global.moment = require('moment');

// db connection
const db = require('./db/connection');
// load db models
const db_models_initialize = require('./db/index')

const server = require('./express');

const fs = require('fs'); 

server()