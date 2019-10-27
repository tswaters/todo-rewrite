'use strict'

const path = require('path')

if (process.env.NODE_ENV !== 'test') {
  require('secret-to-env').configSync({
    dir:
      process.env.NODE_ENV === 'production'
        ? null
        : path.join(__dirname, '..', '.env'),
  })
}

const {
  HEALTH_CHECK_PORT_I18N = '49997',
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000',
} = process.env

const { Client, RpcServer, Publisher } = require('amqp-wrapper')
const healthier = require('healthier')

const pool = require('./lib/db')
const logger = require('./lib/logger')
const update = require('./api/update')
const fetch = require('./api/fetch')

;(async () => {
  const amqp = new Client({ hostname, username, password, vhost }, { timeout })

  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))

  await amqp.channel(async ch => {
    const i18nfanout = await Publisher.build(ch, 'i18n-update-fanout')

    const fetcher = await RpcServer.build(ch, 'i18n-fetch', fetch)

    const updater = await RpcServer.build(ch, 'i18n-update', async msg => {
      const result = await update(msg)
      // if we get a successfully localization update, fanout to the rest of the app
      if (result.status === 200) await i18nfanout.publish(msg)
      return result
    })

    i18nfanout.on('error', err => logger.error(err))
    fetcher.on('error', err => logger.error(err))
    updater.on('error', err => logger.error(err))
  })

  healthier({ logger })
    .create({ path: '/health' })
    .add('amqp', () => amqp.healthy)
    .add('postgres', () => pool.query('SELECT 1'))
    .listen(HEALTH_CHECK_PORT_I18N)

  const close = () => amqp.close()
  process.once('SIGTERM', close)
  process.once('SIGINT', close)
})().catch(err => {
  logger.error(err)
  process.exit(1)
})
