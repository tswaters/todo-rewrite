'use strict'

const {configSync} = require('secret-to-env')
configSync({dir: process.env.NODE_ENV === 'production' ? null : '../.env'})

const express = require('express')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const uuid = require('uuid')

const api = require('./api')
const errors = require('./middleware/errors')
const loggerMiddleware = require('./middleware/logger')
const logger = require('./lib/logger')
const {not_found} = require('./lib/errors')


const {REDIS_HOST, REDIS_PORT, REDIS_SESSION_DB, SESSION_SECRET} = process.env

const app = express()

const sessionStore = new RedisStore({
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: parseInt(REDIS_SESSION_DB, 10)
})

let session_ready = false
sessionStore.on('connect', () => session_ready = true)
sessionStore.on('disconnect', () => session_ready = false)

const sessionMiddleware = session({
  store: sessionStore,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})

app.use(express.json())
app.use(sessionMiddleware)
app.use(loggerMiddleware)
app.use('/api', api)

app.get('/health', async (req, res, next) => {

  let client = null
  try {
    client = await app.locals.pool.connect()
    await client.query('SELECT 1')
  } catch (err) {
    return next(err)
  } finally {
    client && client.release()
  }

  if (!session_ready) {
    return next(new Error('redis unavailable'))
  }

  return res.status(200).end('OK')
})

app.locals.logger = logger

app.get('*', (req, res, next) => {
  next(not_found(`Could not find ${req.path}`))
})

app.use(errors)

const server = app.listen(3000, () => logger.info('listening on 3000'))

const connections = {}
let terminating = false

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
