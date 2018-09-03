

const {
  AMQP_HOST: hostname = 'localhost',
  AMQP_USER: username,
  AMQP_PASS: password,
  AMQP_VHOST: vhost = 'todo',
  AMQP_RECONNECT_TIMEOUT: timeout = '10000'
} = process.env

const assert = require('assert')
const sinon = require('sinon')
const {Client, RpcClient, RpcServer} = require('../../index')

describe('rpc integration test', () => {

  // set up a sane rpc configuration and make sure we can send/receive messages.
  let clock = null
  let client = null
  let rpc_client = null

  beforeEach(() => {
    clock = sinon.useFakeTimers({toFake: ['setInterval']})
    client = new Client({hostname, username, password, vhost}, {timeout})
  })

  afterEach(async () => {
    await client.close()
    clock.restore()
  })

  it('happy path', async () => {

    await client.channel(async ch => {
      await RpcServer.build(ch, 'echo', msg => msg, {prefetch: 1})
      rpc_client = await RpcClient.build(ch, 'echo')
    })

    const result = await rpc_client.send({foo: 'bar'})
    assert.deepEqual(result, {foo: 'bar'})

  })

  it('worker responds with error', async () => {

    await client.channel(async ch => {
      await RpcServer.build(ch, 'echo', () => ({error: new Error('aw snap!')}), {prefetch: 1})
      rpc_client = await RpcClient.build(ch, 'echo')
    })

    const result = await rpc_client.send({foo: 'bar'})
    assert.deepEqual(result.error.message, 'aw snap!')

  })

  it('client with no server', async () => {

    await client.channel(async ch => {
      rpc_client = await RpcClient.build(ch, 'echo')
    })

    const result = await rpc_client.send({foo: 'bar'})
    assert.deepEqual(result, {status: 503,  error: 'service unavailable'})
  })

  it('client with timeout', async () => {

    return client.channel(async ch => {
      await RpcServer.build(ch, 'echo', () => new Promise(() => {}), {prefetch: 1})
      rpc_client = await RpcClient.build(ch, 'echo')
    })
      .then(() => {
        const p = rpc_client.send({foo: 'bar'})
        clock.tick(60001)
        return p
      })
      .then(result => assert.deepEqual(result, {status: 504, error: 'gateway timeout'}))
  })

})
