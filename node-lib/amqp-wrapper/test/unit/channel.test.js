
'use strict'

const assert = require('assert')
const sinon = require('sinon')
const Channel = require('../../lib/channel')

const FakeConnection = require('../fixtures/fake-connection')
const FakeChannel = require('../fixtures/fake-channel')

const init = async () => {}

describe('channel unit test', () => {

  let amqp_connection = null
  let amqp_channel = null

  beforeEach(() => {
    amqp_connection = sinon.createStubInstance(FakeConnection)
    amqp_channel = sinon.createStubInstance(FakeChannel)
    amqp_connection.createConfirmChannel.resolves(amqp_channel)

    // restore event emitter methods
    amqp_connection.emit.restore()
    amqp_connection.on.restore()
    amqp_channel.emit.restore()
    amqp_channel.on.restore()
  })

  describe('#constructor', () => {

    let channel = null

    beforeEach(() => {
      channel = new Channel(amqp_connection)
      sinon.stub(channel, 'connect')
      sinon.stub(channel, 'reconnect')
      channel.channel = amqp_channel
    })

    it('should connect properly', () => {
      amqp_connection.emit('connect')
      assert.equal(channel.reconnect.callCount, 1)
    })

    it('should not disconnect if not connected', () => {
      amqp_connection.emit('disconnect')
      assert.equal(amqp_channel.close.callCount, 0)
    })

    it('should disconnect properly', () => {
      channel.connected = true
      amqp_connection.emit('disconnect')
      assert.equal(amqp_channel.close.callCount, 1)
      assert.equal(channel.closing, true)
    })

  })

  describe('#reconnect', () => {

    let channel = null
    let connect_stub = null
    let clock = null

    beforeEach(() => {
      channel = new Channel(amqp_connection)
      connect_stub = sinon.stub(channel, 'connect')
      clock = sinon.useFakeTimers({toFake: ['setInterval']})
    })

    afterEach(() => {
      clock.restore()
    })

    it('should do nothing if closing', async () => {
      channel.closing = true
      await channel.reconnect()
      assert.equal(connect_stub.callCount, 0)
    })

    it('should wait a little while and call connect', async () => {
      const promise = channel.reconnect()
      clock.tick(10000)
      await promise
      assert.equal(connect_stub.callCount, 1)
    })

  })

  describe('#connect', () => {

    let channel = null
    let reconnect_stub = null

    beforeEach(() => {
      channel = new Channel(amqp_connection, init)
      sinon.spy(channel, 'emit')
      reconnect_stub = sinon.stub(channel, 'reconnect')
    })

    it('should work', async () => {
      await channel.connect(amqp_connection)
      assert.equal(channel.emit.callCount, 1)
      assert.equal(channel.emit.firstCall.args[0], 'connect')
      assert.equal(channel.connected, true)
    })

    it('should emit error events', async () => {
      channel.on('error', err => assert.equal(err.message, 'aw snap'))
      await channel.connect(amqp_connection)
      amqp_channel.emit('error', new Error('aw snap'))
    })

    it('should emit close events', async () => {
      await channel.connect(amqp_connection)
      amqp_channel.emit('close')
    })

    it('should handle errors and attempt to reconnect', async () => {
      amqp_connection.createConfirmChannel.rejects(new Error('aw snap!'))
      channel.on('error', err => assert.equal(err.message, 'aw snap!') )
      await channel.connect(amqp_connection, init)
      assert.equal(channel.connected, false)
      assert.equal(reconnect_stub.callCount, 1)
    })

  })

})
