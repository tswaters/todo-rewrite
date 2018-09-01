'use strict'

const EventEmitter = require('events')
const debug = require('debug')('amqp-wrapper:channel')

class Channel  extends EventEmitter {

  constructor (connection, init, timeout = 10000) {
    super()
    this.init = init
    this.timeout = timeout
    this.closing = false
    this.connected = false
    this.channel = null

    connection.on('connect', conn => {
      debug('connection restablished, connecting channel')
      this.connect(conn).catch(err => this.emit('error', err))
    })

    connection.on('disconnect', () => {
      if (!this.connected) { return }
      debug('connection disconnected, closing')
      this.closing = true
      this.channel.close()
    })

  }

  async reconnect (conn) {
    this.channel = null
    if (!this.closing) {
      await new Promise(resolve => setTimeout(resolve, parseInt(this.timeout)))
      debug('reconnecting')
      await this.connect(conn)
    }
  }

  async connect (conn) {
    try {
      debug('attempting to create new channel')
      const channel = await conn.createConfirmChannel()

      channel.on('error', err => {
        debug(err)
        this.emit('error', err)
      })

      channel.on('close', () => {
        debug('Channel closed')
        this.emit('close')
      })

      debug('calling into setup routine')
      await this.init(channel)

      this.channel = channel
      debug('finished creating channel')
      this.emit('connect')
      this.connected = true

    } catch (err) {
      debug('Failed to establish channel!')
      debug(err)
      this.emit('error', err)

      // attempt to reconnect if we hit an error above.
      // this doesn't await for the following reasons:
      //  (1) don't halt application startup
      //  (2) don't hit callstack limits by using `await`
      // this will bump the stack out because `reconnect` uses setTimeout
      // eventually it will connect (assuming amqp is available of course)
      this.reconnect(conn)
    }
  }

}

module.exports = Channel
