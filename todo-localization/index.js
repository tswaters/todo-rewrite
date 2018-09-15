
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
  PORT = '49997',
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const http = require('http')
const {Client, RpcServer, Publisher} = require('amqp-wrapper')
const pool = require('./lib/db')
const logger = require('./lib/logger')
const update = require('./api/update')
const fetch = require('./api/fetch')

;(async () => {

  const amqp = new Client({hostname, username, password, vhost}, {timeout})

  let amqp_healthy = false

  amqp.on('error', err => logger.error(err))
  amqp.on('connect', () => { logger.info('amqp is connected'); amqp_healthy = true})
  amqp.on('close', () => { logger.info('amqp connection closed');  amqp_healthy = false})
  amqp.on('channel-error', err => logger.error(err))
  amqp.on('channel-connect', () => { logger.info('channel connected'); amqp_healthy = true})
  amqp.on('channel-close', () => { logger.info('channel closed'); amqp_healthy = false})

  await amqp.channel(async ch => {

    const publisher = await Publisher.build(ch, 'i18n-update-fanout')

    const fetcher = await RpcServer.build(ch, 'i18n-fetch', fetch)

    const updater = await RpcServer.build(ch, 'i18n-update', async msg => {
      const result = await update(msg)
      if (result.status === 200) {
        await publisher.publish(msg)
      }
      return result
    }, {prefetch: 1})

    publisher.on('error', err => logger.error(err))
    fetcher.on('error', err => logger.error(err))
    updater.on('error', err => logger.error(err))

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

  }).listen(parseInt(PORT), () => logger.info(`Healthcheck server listening on ${PORT}`))

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
