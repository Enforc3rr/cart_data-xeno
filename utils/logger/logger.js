const winston = require("winston");
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    level: 'debug',
    format: combine(
    timestamp(),
    myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({filename : "info.log", level : "info"}),
        new transports.File({ filename: 'final.log' }),
    ],
});

if (process.env.NODE_ENV !== 'PRODUCTION') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

module.exports = logger;