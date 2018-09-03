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
      this.reconnect(conn)
    })

    connection.on('close', () => {
      debug('connection closed, clearing retry intervals')
      clearInterval(this.interval)
      this.connected = false
      this.interval = null
    })

    // disconnect is special - used to identify a request to close everything (i.e. sigterm)
    // if this is hit, there is no desire to reopen the connection - halt & catch fire.
    connection.on('disconnect', () => {
      clearInterval(this.interval)
      this.interval = null
      if (!this.connected) { return }
      debug('connection disconnected, closing')
      this.closing = true
      this.channel.close()
    })

  }

  reconnect (conn) {
    if (this.interval != null) { return } // safety
    debug('setting up interval %d to reconnect', this.timeout)
    if (!this.closing) {
      this.interval = setInterval(() => {
        debug('reconnecting')
        this.connect(conn)
      }, parseInt(this.timeout))
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
        this.reconnect(conn)
      })

      debug('calling into setup routine')
      await this.init(channel)

      debug('finished creating channel')
      clearInterval(this.interval)
      this.interval = null
      this.channel = channel
      this.emit('connect')
      this.connected = true

    } catch (err) {
      debug('Failed to establish channel!')
      debug(err)
      this.emit('error', err)

      if (this.interval == null) {
        this.reconnect(conn)
      }
    }
  }

}

module.exports = Channel
