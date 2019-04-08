'use strict'

// the order here is important.
// server.js loads things into `process.env`
// logger depends on up-to-date process.env
// this file is not required from tests.

const http = require('http')
const server = require('./server')
const logger = require('./lib/logger')
const services = require('./services')
const {fetch} = require('./services/i18n')
const {init, healthy: i18n_healthy} = require('./lib/i18n')
const session = require('./middleware/session')

const {PORT='3000', HEALTH_CHECK_PORT_API = '49996'} = process.env

const health_server = http.createServer(async (req, res) => {

  if (!services.healthy()) {
    logger.warn('services unhealthy')
    res.statusCode = 500
    return res.end()
  }

  if (!session.healthy()) {
    logger.warn('session unhealthy')
    res.statusCode = 500
    return res.end()
  }

  if (!i18n_healthy()) {
    logger.warn('no i18n keys')
    res.statusCode = 500
    return res.end()
  }

  res.statusCode = 200
  return res.end('OK')

}).listen(parseInt(HEALTH_CHECK_PORT_API), () => logger.info(`Healthcheck server listening on ${HEALTH_CHECK_PORT_API}`))

process.on('SIGTERM', terminate)
process.on('SIGINT', terminate)

function terminate () {
  logger.info('Healthcheck server is shutting down...')
  health_server.close(() => logger.info('Healthcheck server shutdown complete...'))
}

(async () => {

  await services.init()

  const keys = await fetch({locale: 'en'})
  init('en', keys)

  server.listen(PORT, () => logger.info(`listening on ${PORT}`))

})()
  .catch(err => {
    logger.fatal(err)
    process.exit(1)
  })
