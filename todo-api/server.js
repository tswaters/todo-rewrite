
if (process.env.NODE_ENV !== 'test') {
  require('secret-to-env').configSync({
    dir: process.env.NODE_ENV === 'production'
      ? null
      : '../.env'
  })
}

const http = require('http')
const uuid = require('uuid')

const app = require('./app')
const logger = require('./lib/logger')

const connections = {}
let terminating = false

const server = http.createServer(app)

const connection_logger = connection_id => logger.child({connection_id})

server.on('connection', connection => {
  const id = uuid.v4()
  connection.idle = true
  connection.id = id
  connections[id] = connection
  connection.on('close', () => {
    connection_logger(id).debug('Connection is gone')
    delete connections[id]
  })
})

server.on('request', ({connection}, res) => {
  connection.idle = false
  res.on('finish', () => {
    connection.idle = true
    if (terminating) {
      connection_logger(connection.id).debug('Connection is gone')
      connection.destroy()
    }
  })
})

process.on('SIGTERM', terminate)
process.on('SIGINT', terminate)

function terminate () {
  logger.info('Server is shutting down...')
  terminating = true

  server.close(() => {
    logger.info('Server shutdown complete...')
    process.exit(0)
  })

  for (const [, connection] of Object.entries(connections)) {
    if (connection.idle) {
      connection_logger(connection.id).debug('Connection is gone')
      connection.destroy()
    }
  }
}

// export so tests can use it.
module.exports = server
