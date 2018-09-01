
const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_SESSION_DB = '0',
  SESSION_SECRET
} = process.env

const session = require('express-session')
const RedisStore = require('connect-redis')(session)

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

exports.healthy = () => session_ready

exports.middleware = sessionMiddleware
