
'use strict'

const http = require('http')
const {Client, RpcServer} = require('amqp-wrapper')
const path = require('path')

if (process.env.NODE_ENV !== 'test') {
  require('secret-to-env').configSync({
    dir: process.env.NODE_ENV === 'production'
      ? null
      : path.join(__dirname, '..', '.env')
  })
}

const {
  HEALTH_CHECK_PORT = '49998',
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const pool = require('./lib/pg')
const logger = require('./lib/logger')

const complete = require('./api/complete')
const create = require('./api/create')
const fetch = require('./api/fetch')
const remove = require('./api/remove')
const restore = require('./api/restore')
const update = require('./api/update')
const things = {complete, create, fetch, remove, restore, update}

;(async () => {

  const amqp = new Client({protocol: 'amqp', hostname, username, password, vhost}, {timeout})

  let amqp_healthy = false

  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))
  amqp.on('connect', () => { logger.info('amqp is connected'); amqp_healthy = true })
  amqp.on('close', () => { logger.info('amqp connection closed'); amqp_healthy = false })
  amqp.on('channel-connect', () => logger.info('channel connected'))
  amqp.on('channel-close', () => logger.info('channel closed'))

  await amqp.channel(async channel => Promise.all(
    Object.entries(things).map(async ([key, worker]) => {
      const server = await RpcServer.build(channel, `items-${key}`, worker, {prefetch: 1})
      server.on('error', err => logger.error(err))
      return server
    })
  ))

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
    process.exit(0)
  }

})()
  .catch(err => {
    logger.fatal(err)
    process.exit(1)
  })

