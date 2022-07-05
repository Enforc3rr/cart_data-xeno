# Documentation : Cart_Info


### Endpoints : Details regarding endpoint can be found above their respective controller functions.


#### Logger : Winston 
- https://www.npmjs.com/package/winston
```
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
```
- Basically we are logging out the following levels
```
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
```
- info.log file contains all the log that's present at levels 0 , 1 , 2 
- final.log file contains everything.
- console contains : ${timestamp} ${level}: ${message}

I probably would have added logs to check network requests as well.


