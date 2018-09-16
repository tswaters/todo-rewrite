

const {
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const EventEmitter = require('events')
const assert = require('assert')
const {Client, Publisher, Subscriber} = require('../../index')

describe('pubsub integration test', () => {

  let client = null

  beforeEach(() => {
    client = new Client({hostname, username, password, vhost}, {timeout})
  })

  afterEach(async () => {
    await client.close()
  })

  it('happy path', async () => {

    let publisher = null
    const emitter = new EventEmitter()

    const worker = msg => {
      try {
        assert.deepEqual(msg, {success: true})
        emitter.emit('done')
      } catch (err) {
        emitter.emit('error', err)
      }
    }

    const waiter = new Promise((resolve, reject) => {
      emitter.on('done', resolve)
      emitter.on('error', reject)
    })

    await client.channel(async ch => {
      publisher = await Publisher.build(ch, 'fanout-test')
      await Subscriber.build(ch, 'fanout-test', worker)
    })

    await publisher.publish({success: true})

    await waiter

  })

  it('nacking messages', async () => {

    let subscriber = null
    let publisher = null
    let call = 0
    const emitter = new EventEmitter()

    const worker = async msg => {
      if (call++ === 0) {
        throw new Error('aw snap!')
      } else {
        try {
          assert.deepEqual(msg, {success: true})
          emitter.emit('done')
        } catch (err) {
          emitter.emit('error', err)
        }
      }
    }

    const waiter = new Promise((resolve, reject) => {
      emitter.on('done', resolve)
      emitter.on('error', reject)
    })

    await client.channel(async ch => {
      publisher = await Publisher.build(ch, 'fanout-test')
      subscriber = await Subscriber.build(ch, 'fanout-test', worker)
      subscriber.on('error', () => {})
    })

    await publisher.publish({success: true})

    await waiter

  })

})
