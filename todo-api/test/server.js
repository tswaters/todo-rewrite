const express = require('express')
const session = require('express-session')
const pino = require('pino')
const errors = require('../middleware/errors')
const logger = require('../lib/logger')

module.exports = () => {
  const context = new express.Router()
  const app = express()
  app.locals.logger = logger
  app.use(express.json())
  app.use(
    session({
      secret: 'magically',
      resave: false,
      saveUninitialized: false,
    })
  )

  app.use((req, res, next) => {
    req.logger = pino({ level: 'silent' })
    next()
  })
  app.use(context)
  app.get('/tests/clear-session', (req, res) => {
    req.session.destroy()
    res.send('ok')
  })
  app.use(errors)
  return { app, context }
}
