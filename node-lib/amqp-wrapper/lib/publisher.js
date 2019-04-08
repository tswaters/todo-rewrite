const EventEmitter = require('events')
const debug = require('debug')('amqp-wrapper:publisher')

class Publisher extends EventEmitter {
  static async build(channel, exchange) {
    const publisher = new Publisher(channel, exchange)
    await publisher.init()
    return publisher
  }

  constructor(channel, exchange) {
    super()
    this.exchange = exchange
    this.channel = channel
  }

  async init() {
    debug('asserting fanout exchange %s', this.exchange)
    await this.channel.assertExchange(this.exchange, 'fanout', {
      durable: false,
      autoDelete: true,
    })
  }

  async publish(msg) {
    try {
      debug('publishing message to %s', this.exchange)
      await this.channel.publish(
        this.exchange,
        '',
        Buffer.from(JSON.stringify(msg))
      )
    } catch (err) {
      this.emit('error', err)
    }
  }
}

module.exports = Publisher
