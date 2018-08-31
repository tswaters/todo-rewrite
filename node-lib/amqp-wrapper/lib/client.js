'use strict'

const EventEmitter = require('events')
const amqp = require('amqplib')
const debug = require('debug')('amqp-wrapper:client')

const Channel = require('./channel')

class Client extends EventEmitter {

  constructor (amqpConn, {timeout = 10000} = {}) {
    super()
    this.client = null
    this.connObj = amqpConn
    this.timeout = timeout
    this.setMaxListeners(0)

    // when we close, attempt to reconnect
    this.on('close', () => {
      debug('closed')
      this.reconnect()
    })

    // when we successfully connect, save the client
    this.on('connect', client => {
      debug('connected')
      this.client = client
    })

  }

  async reconnect () {
    this.client = null
    if (!this.closing) {
      debug('reconnecting')
      await new Promise(resolve => setTimeout(resolve, parseInt(this.timeout)))
      await this.connect()
    }
  }

  async connect () {
    debug('Attempting to connect...')
    try {

      const client = await amqp.connect(this.connObj)

      client.on('error', err => {
        debug('Client hit an error', err)
        this.emit('error', err)
      })

      client.on('close', () => {
        debug('Closed connection')
        this.emit('close')
      })

      debug('Finished connecting')
      this.emit('connect', client)

    } catch (err) {

      debug(err)
      this.emit('error', err)
      this.reconnect()

    }
  }

  async channel (init) {

    if (!this.client) {
      await this.connect()
    }

    const channel = new Channel(this, init, this.timeout)
    channel.on('close', () => this.emit('channel-close', channel))
    channel.on('error', err => this.emit('channel-error', err))
    channel.on('connect', () => this.emit('channel-connect'))
    await channel.connect(this.client)
  }

  async close () {
    debug('closing')
    this.emit('disconnect') // special event fired before calling close.
    this.closing = true
    if (this.client) {
      await this.client.close()
    }
  }

}

module.exports = Client
