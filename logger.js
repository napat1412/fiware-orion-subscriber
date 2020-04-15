const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const config = require('./config');

const logger = createLogger({
  //level: 'warn',
  level: config.loglevel,
  format: format.combine(
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.colorize(),
    format.simple()
  ),
  //transports: [new transports.Console()]
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info =>
            `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
      )
    })
  ]
});

module.exports = logger;
