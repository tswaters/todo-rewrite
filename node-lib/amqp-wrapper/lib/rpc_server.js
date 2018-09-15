
const EventEmitter = require('events')
const debug = require('debug')('amqp-wrapper:rpc_server')

class RpcServer extends EventEmitter {

  static async build (channel, queueName, worker, options) {
    const server = new RpcServer(channel, queueName, options)
    await server.listen(worker)
    return server
  }

  constructor (channel, queueName, {prefetch = null} = {}) {
    super()
    this.channel = channel
    this.queueName = queueName
    this.prefetch = prefetch
  }

  async listen (worker) {

    debug('asserting queue %s', this.queueName)
    await this.channel.assertQueue(this.queueName, {autoDelete: true})

    if (this.prefetch) {
      debug('setting up prefetch %d', this.prefetch)
      this.channel.prefetch(this.prefetch)
    }

    debug('setting up consumer for %s', this.queueName)
    await this.channel.consume(this.queueName, async msg => {
      if (!msg) { return }
      try {
        const {content, properties: {correlationId, replyTo}} = msg
        debug('received request. correlationId: %s, replyTo: %s', correlationId, replyTo)
        const payload = JSON.parse(content.toString())
        const result = await worker(payload)

        if (result.error) {
          result.error = {
            message: result.error.message,
            stack: result.error.stack,
            ...result.error
          }
        }

        const message = Buffer.from(JSON.stringify(result))

        debug('sending response from worker')
        this.channel.sendToQueue(replyTo, message, {correlationId})
        this.channel.ack(msg)
      } catch (err) {
        debug('encountered an error', err)
        this.emit('error', err)
        this.channel.reject(msg, true)
      }
    })
  }

}

module.exports = RpcServer
