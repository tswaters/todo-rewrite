'use strict'

// the order here is important.
// server.js loads things into `process.env`
// logger depends on up-to-date process.env
// this file is not required from tests.

const server = require('./server')
const logger = require('./lib/logger')
const services = require('./services')
const {PORT = '3000'} = process.env

;(async () => {

  await services.init()
  server.listen(PORT, () => logger.info(`listening on ${PORT}`))

})()
  .catch(err => {
    logger.fatal(err)
    process.exit(1)
  })
