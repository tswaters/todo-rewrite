
'use strict'

const EventEmitter = require('events')

class FakeConnection extends EventEmitter {

  connect () {

  }

  close () {

  }

  createConfirmChannel () {

  }

}

module.exports = FakeConnection
