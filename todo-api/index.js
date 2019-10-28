'use strict'

// the order here is important.
// server.js loads things into `process.env`
// logger depends on up-to-date process.env
// this file is not required from tests.

const { Client } = require('amqp-wrapper')
const healthier = require('healthier')

const server = require('./server')
const logger = require('./lib/logger')

const { init: init_auth } = require('./services/auth')
const { init: init_todo } = require('./services/todo')
const { init: init_i18n } = require('./services/i18n')
const { healthy: i18n_healthy } = require('./lib/i18n')
const session = require('./middleware/session')

const {
  PORT = '3000',
  HEALTH_CHECK_PORT_API = '49996',
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000',
} = process.env

;(async () => {
  const amqp = new Client(
    { protocol: 'amqp', hostname, username, password, vhost },
    { timeout }
  )

  healthier({ logger })
    .create({ path: '/health' })
    .add('amqp', () => amqp.healthy)
    .add('session', () => session.healthy())
    .add('i18n', () => i18n_healthy())
    .listen(HEALTH_CHECK_PORT_API)

  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))

  await amqp.channel(init_auth)
  await amqp.channel(init_todo)
  await amqp.channel(init_i18n)

  server.listen(PORT, () => logger.info(`listening on ${PORT}`))
})().catch(err => {
  logger.fatal(err)
  process.exit(1)
})
