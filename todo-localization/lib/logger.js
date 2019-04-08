const { LOG_LEVEL: level = 'debug' } = process.env

module.exports = require('pino')({ level })
