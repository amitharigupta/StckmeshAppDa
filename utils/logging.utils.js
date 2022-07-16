// Main file for Winston Logging
const winston = require('winston');
const logger = winston.createLogger({
    levels: { 
        'alert': 1, 
        'error': 3, 
        'warning': 4, 
        'api': 5, 
        'info': 6, 
        'debug': 7,
        'db': 8
    }
})

winston.addColors({
    'api': 'cyan',
    'db': 'yellow'
})

const console_logging_format = winston.format.combine(
    winston.format.splat(),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
)
const file_logging_format = winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
)

// Adding console logger
logger.add(new winston.transports.Console({
    format: console_logging_format,
    level: config.log_level
}));

module.exports = (fileLogging=null) => {
    // Adding file logger if required
    if(fileLogging != undefined && fileLogging != null){
        logger.add(new winston.transports.File(
            {
                filename: fileLogging,
                format: file_logging_format,
            }
        ));
    }
    return logger
}