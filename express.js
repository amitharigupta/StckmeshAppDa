const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();

const routes = require('./routes/index');

// For combining winston logs with morgan
const myStream = {
    write: (text) => {
        if(text.split('/')[1] != undefined && text.split('/')[1] == 'api')
            logging.api(text.replace(/\n$/, '')) 
    }
}
// Logger for HTTP Requests
app.use(logger('tiny', { stream: myStream }))

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));

// Enable Cross-origin resource sharing
app.use(cors());

// Enable gzip compression
app.use(compression());

// static path for frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Enable helmet middleware
app.use(helmet());

// Disable x-powered-by header
app.disable('x-powered-by');

// Enable routes
app.use(routes());

app.enable('trust proxy');

module.exports = () => {
    app.listen(config.http_port, () => {
        logging.info(`Server listening on: ${config.http_port}`); // eslint-disable-line no-console
    });
};
