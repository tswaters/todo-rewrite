
const EventEmitter = require('events')
const debug = require('debug')('amqp-wrapper:subscriber')

class Subscriber extends EventEmitter {

  static async build (channel, exchange, worker) {
    const publisher = new Subscriber(channel, exchange)
    await publisher.init(worker)
    return publisher
  }

  constructor (channel, exchange) {
    super()
    this.exchange = exchange
    this.channel = channel
  }

  async init (worker) {

    debug('asserting fanout exchange %s', this.exchange)
    await this.channel.assertExchange(this.exchange, 'fanout', {durable: false, autoDelete: true})

    ;({queue: this.queueName} = await this.channel.assertQueue('', {exclusive: true}))
    debug('asserted queue %s', this.queueName)

    await this.channel.bindQueue(this.queueName, this.exchange, '')
    debug('bound queue %s to exchange %s', this.queueName, this.exchange)

    this.channel.consume(this.queueName, async msg => {
      try {
        await worker(JSON.parse(msg.content.toString()))
        this.channel.ack(msg)
      } catch (err) {
        this.emit('error', err)
        await this.channel.nack(msg)
      }
    })
  }

}

module.exports = Subscriber
