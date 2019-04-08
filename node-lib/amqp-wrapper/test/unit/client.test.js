'use strict'

const assert = require('assert')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const FakeConnection = require('../fixtures/fake-connection')
const FakeChannel = require('../fixtures/fake-channel')
const Channel = require('../../lib/channel')

describe('client unit test', () => {
  let Client = null
  let connection = null
  let channel = null
  const connect_stub = sinon.stub()

  beforeEach(() => {
    channel = sinon.createStubInstance(Channel)
    channel.on.restore()
    channel.emit.restore()

    connection = sinon.createStubInstance(FakeConnection)
    connection.emit.restore()
    connection.on.restore()

    const amqp_channel = sinon.createStubInstance(FakeChannel)
    connection.createConfirmChannel.resolves(amqp_channel)

    connect_stub.resolves(connection)
    Client = proxyquire('../../lib/client', {
      amqplib: { connect: connect_stub },
      './channel': sinon.stub().returns(channel),
    })
  })

  afterEach(() => {
    connect_stub.reset()
  })

  describe('#constructor', () => {
    let client = null
    let reconnect_stub = null

    beforeEach(() => {
      client = new Client()
      reconnect_stub = sinon.stub(client, 'reconnect')
    })

    it('should reconnect on close events', () => {
      client.emit('close')
      assert.equal(reconnect_stub.callCount, 1)
    })

    it('should setup client on connect success', () => {
      client.emit('connect', connection)
      assert.equal(client.client, connection)
    })
  })

  describe('#reconnect', () => {
    let client = null
    let clock = null

    beforeEach(() => {
      client = new Client()
      sinon.stub(client, 'connect')
      clock = sinon.useFakeTimers({ toFake: ['setInterval'] })
    })

    afterEach(() => {
      clock.restore()
    })

    it('should not do anything if closing', async () => {
      client.closing = true
      client.reconnect()
      assert.equal(client.connect.callCount, 0)
    })

    it('should connect after timeout', async () => {
      client.reconnect()
      clock.tick(10000)
      assert.equal(client.connect.callCount, 1)
    })
  })

  describe('#connect', () => {
    let client = null

    beforeEach(() => {
      client = new Client()
      client.removeAllListeners() // remove listeners attached in constructor
      sinon.stub(client, 'reconnect')
      sinon.spy(client, 'emit')
    })

    it('should respond to error events', async () => {
      client.on('error', () => {})
      await client.connect()
      connection.emit('error', new Error('aw snap!'))
      assert.equal(client.emit.callCount, 2)
      assert.equal(client.emit.firstCall.args[0], 'connect')
      assert.equal(client.emit.secondCall.args[0], 'error')
      assert.equal(client.emit.secondCall.args[1].message, 'aw snap!')
    })

    it('should respond to close events', async () => {
      await client.connect()
      connection.emit('close')
      assert.equal(client.emit.callCount, 2)
      assert.equal(client.emit.firstCall.args[0], 'connect')
      assert.equal(client.emit.secondCall.args[0], 'close')
    })

    it('should respond to errors', async () => {
      connect_stub.rejects(new Error('aw snap!'))
      client.on('error', () => {})
      await client.connect()
      assert.equal(client.reconnect.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'error')
      assert.equal(client.emit.firstCall.args[1].message, 'aw snap!')
    })
  })

  describe('#channel', () => {
    let client = null

    beforeEach(() => {
      client = new Client()
      client.removeAllListeners()
      sinon
        .stub(client, 'connect')
        .callsFake(() => (client.client = 'non-falsy'))
      sinon.spy(client, 'emit')
    })

    it('should connect if not yet connected, connect channel', async () => {
      await client.channel()
      assert.equal(client.connect.callCount, 1)
      assert.equal(channel.connect.callCount, 1)
    })

    it('should connect channel', async () => {
      client.client = true
      await client.channel()
      assert.equal(client.connect.callCount, 0)
      assert.equal(channel.connect.callCount, 1)
    })

    it('should emit close events', async () => {
      await client.channel()
      channel.emit('close')
      assert.equal(client.emit.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'channel-close')
    })

    it('should emit error events', async () => {
      await client.channel()
      channel.emit('error', new Error('aw snap!'))
      assert.equal(client.emit.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'channel-error')
      assert.equal(client.emit.firstCall.args[1].message, 'aw snap!')
    })

    it('should emit connect events', async () => {
      await client.channel()
      channel.emit('connect')
      assert.equal(client.emit.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'channel-connect')
    })
  })

  describe('#close', () => {
    let client = null

    beforeEach(() => {
      client = new Client()
      client.removeAllListeners()
      sinon.spy(client, 'emit')
    })

    it('should emit diconnect and close', async () => {
      await client.close()
      assert.equal(client.emit.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'disconnect')
    })

    it('should close client if it exists', async () => {
      client.client = connection
      await client.close()
      assert.equal(client.emit.callCount, 1)
      assert.equal(client.emit.firstCall.args[0], 'disconnect')
      assert.equal(connection.close.callCount, 1)
    })
  })
})
