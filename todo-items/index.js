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
  HEALTH_CHECK_PORT_ITEMS = '49998',
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000',
} = process.env

const { Client, RpcServer } = require('amqp-wrapper')
const healthier = require('healthier')

const pool = require('./lib/pg')
const logger = require('./lib/logger')

const complete = require('./api/complete')
const create = require('./api/create')
const fetch = require('./api/fetch')
const remove = require('./api/remove')
const restore = require('./api/restore')
const update = require('./api/update')
const things = { complete, create, fetch, remove, restore, update }

;(async () => {
  const amqp = new Client(
    { protocol: 'amqp', hostname, username, password, vhost },
    { timeout }
  )

  healthier({ logger })
    .create({ path: '/health' })
    .add('amqp', () => amqp.healthy)
    .add('postgres', () => pool.query('SELECT 1'))
    .listen(HEALTH_CHECK_PORT_ITEMS)

  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))

  await amqp.channel(async channel =>
    Promise.all(
      Object.entries(things).map(async ([key, worker]) => {
        const server = await RpcServer.build(channel, `items-${key}`, worker, {
          prefetch: 1,
        })
        server.on('error', err => logger.error(err))
        return server
      })
    )
  )

  const close = () => amqp.close()
  process.once('SIGTERM', close)
  process.once('SIGINT', close)
})().catch(err => {
  logger.fatal(err)
  process.exit(1)
})
