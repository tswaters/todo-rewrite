'use strict'

// the order here is important.
// server.js loads things into `process.env`
// logger depends on up-to-date process.env
// this file is not required from tests.

const server = require('./server')
const logger = require('./lib/logger')
const {PORT = '3000'} = process.env

server.listen(PORT, () => logger.info(`listening on ${PORT}`))
