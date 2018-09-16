
'use strict'

const path = require('path')

if (process.env.NODE_ENV !== 'test') {
  require('secret-to-env').configSync({
    dir: process.env.NODE_ENV === 'production'
      ? null
      : path.join(__dirname, '..', '.env')
  })
}

const {
  HEALTH_CHECK_PORT = '49999',
  AMQP_HOST: hostname,
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const http = require('http')
const {Client, RpcServer} = require('amqp-wrapper')

const logger = require('./lib/logger')
const pool = require('./lib/pg')
const login = require('./api/login')
const register = require('./api/register')

;(async () => {

  const amqp = new Client({protocol: 'amqp', hostname, username, password, vhost}, {timeout})

  let amqp_healthy = false

  amqp.on('error', err => logger.error(err))
  amqp.on('connect', () => { logger.info('amqp is connected'); amqp_healthy = true})
  amqp.on('close', () => { logger.info('amqp connection closed');  amqp_healthy = false})
  amqp.on('channel-error', err => logger.error(err))
  amqp.on('channel-connect', () => { logger.info('channel connected'); amqp_healthy = true})
  amqp.on('channel-close', () => { logger.info('channel closed'); amqp_healthy = false})

  await amqp.channel(async channel => {
    const login_server = await RpcServer.build(channel, 'auth-login', login, {prefetch: 1})
    const register_server = await RpcServer.build(channel, 'auth-register', register, {prefetch: 1})
    login_server.on('error', err => logger.error(err))
    register_server.on('error', err => logger.error(err))
  })

  const health_server = http.createServer(async (req, res) => {

    if (req.url !== '/health') {
      res.statusCode = 404
      return res.end()
    }

    if (!amqp_healthy) {
      logger.warn('amqp unhealthy')
      res.statusCode = 500
      return res.end()
    }

    try {
      await pool.query('SELECT 1')
      res.statusCode = 200
    } catch (err) {
      logger.warn('postgres unhealthy')
      res.statusCode = 500
    } finally {
      res.end()
    }

  }).listen(parseInt(HEALTH_CHECK_PORT), () => logger.info(`Healthcheck server listening on ${HEALTH_CHECK_PORT}`))

  process.once('SIGTERM', close)
  process.once('SIGINT', close)

  async function close () {

    await new Promise(resolve => health_server.close(() => {
      logger.info('Healthcheck server successfully closed')
      resolve()
    }))

    await amqp.close()

  }

})()
  .catch(err => {
    logger.error(err)
    process.exit(1)
  })

