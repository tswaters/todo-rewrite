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
  HEALTH_CHECK_PORT_AUTH = '49999',
  AMQP_HOST: hostname,
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000',
} = process.env

const { Client, RpcServer } = require('amqp-wrapper')
const healthier = require('healthier')

const logger = require('./lib/logger')
const pool = require('./lib/pg')
const login = require('./api/login')
const register = require('./api/register')

;(async () => {
  const amqp = new Client(
    { protocol: 'amqp', hostname, username, password, vhost },
    { timeout }
  )

  healthier({ logger })
    .create({ path: '/health' })
    .add('amqp', () => amqp.healthy)
    .add('postgres', () => pool.query('SELECT 1'))
    .listen(HEALTH_CHECK_PORT_AUTH)

  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))

  await amqp.channel(async channel => {
    const login_server = await RpcServer.build(channel, 'auth-login', login, {
      prefetch: 1,
    })
    const register_server = await RpcServer.build(
      channel,
      'auth-register',
      register,
      { prefetch: 1 }
    )
    login_server.on('error', err => logger.error(err))
    register_server.on('error', err => logger.error(err))
  })

  const close = () => amqp.close()
  process.once('SIGTERM', close)
  process.once('SIGINT', close)
})().catch(err => {
  logger.error(err)
  process.exit(1)
})
