'use strict'

const {
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const {Client} = require('amqp-wrapper')

const auth = require('./auth')
const logger = require('../lib/logger').child({log_type: 'amqp'})

let amqp = null
let amqp_healthy = false

process.on('SIGTERM', terminate)
process.on('SIGINT', terminate)

async function terminate() {
  await amqp.close()
}

exports.healthy = () => amqp_healthy

exports.init = async () => {
  amqp = new Client({protocol: 'amqp', hostname, username, password, vhost}, {timeout})
  amqp.on('error', err => logger.error(err))
  amqp.on('channel-error', err => logger.error(err))
  amqp.on('connect', () => { logger.info('amqp is connected');  amqp_healthy = true})
  amqp.on('close', () => { logger.info('amqp connection closed'); amqp_healthy = false})
  amqp.on('channel-connect', () => logger.info('channel connected'))
  amqp.on('channel-close', () => logger.info('channel closed'))

  await amqp.channel(auth.init)
}

exports.close = () => amqp.close()
