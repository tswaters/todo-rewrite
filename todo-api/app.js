
const express = require('express')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const api = require('./api')
const errors = require('./middleware/errors')
const loggerMiddleware = require('./middleware/logger')
const logger = require('./lib/logger')
const {not_found} = require('./lib/errors')
const {connect} = require('./lib/db')

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_SESSION_DB = '0',
  SESSION_SECRET
} = process.env

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
    client = await connect()
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

app.all('*', (req, res, next) => {
  next(not_found(`Could not find ${req.path}`))
})

app.use(errors)

module.exports = app
