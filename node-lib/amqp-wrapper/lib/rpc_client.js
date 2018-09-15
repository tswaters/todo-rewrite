'use strict'

const EventEmitter = require('events')
const uuid = require('uuid')
const debug = require('debug')('amqp-wrapper:rpc_client')

class RpcClient extends EventEmitter {

  static async build (channel, name, options = {}) {
    const client = new RpcClient(channel, name, options)
    await client.init()
    return client
  }

  constructor (channel, queueName, {
    timeout = 500,
    serviceUnavailable = () => ({status: 503, error: 'service unavailable'}),
    gatewayTimeout = () => ({status: 504, error: 'gateway timeout'})
  } = {}) {
    super()
    this.timeout = timeout
    this.connected = false
    this.channel = channel
    this.queueName = queueName
    this.serviceUnavailable = serviceUnavailable
    this.gatewayTimeout = gatewayTimeout
    this.emitter = new EventEmitter()
    this.timeouts = {}

    this.channel.on('close', () => this.connected = false)
    this.channel.on('connect', () => this.connected = true)

    this.channel.on('return', msg => {
      const {properties: {correlationId, replyTo}} = msg
      if (replyTo !== this.replyTo) { return }

      debug('received unroutable message %s returning 503', correlationId)
      clearTimeout(this.timeouts[correlationId])
      this.emitter.emit(correlationId, this.serviceUnavailable(msg))
    })

  }

  async init () {

    ({queue: this.replyTo} = await this.channel.assertQueue('', {exclusive: true}))

    debug('setting up consumer for %s named %s', this.queueName, this.replyTo)
    await this.channel.consume(this.replyTo, msg => {
      if (!msg) { return }
      const {content, properties: {correlationId}} = msg
      debug('received response for correlationId: %s', correlationId)
      clearTimeout(this.timeouts[correlationId])
      this.emitter.emit(correlationId, JSON.parse(content.toString()))
      this.channel.ack(msg)
    })

    this.connected = true
  }

  async send (msg) {

    if (!this.connected) {
      return this.serviceUnavailable(msg)
    }

    const correlationId = uuid.v4()
    debug('sending msg to %s with orrelationId: %s, replyTo: %s', this.queueName, correlationId, this.replyTo)
    return new Promise(resolve => {

      this.timeouts[correlationId] = setTimeout(() => this.emitter.emit(correlationId, this.gatewayTimeout(msg)), this.timeout)
      this.emitter.once(correlationId, data => { delete this.timeouts[correlationId]; resolve(data) })

      debug('publishing to %s', this.queueName)
      this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(msg)),
        {correlationId, replyTo: this.replyTo, mandatory: true}
      )
    })
  }

}

module.exports = RpcClient
