
const express = require('express')
const api = require('./api')
const session = require('./middleware/session')
const errors = require('./middleware/errors')
const loggerMiddleware = require('./middleware/logger')
const logger = require('./lib/logger')
const {not_found} = require('./lib/errors')
const {connect} = require('./lib/db')
const services = require('./services')

const app = express()

app.use(express.json())
app.use(session.middleware)
app.use(loggerMiddleware)
app.use('/api', api)

app.get('/health', async (req, res, next) => {

  let client = null
  try {
    client = await connect()
    await client.query('SELECT 1')
  } catch (err) {
    return next(new Error('postgres unavailable'))
  } finally {
    client && client.release()
  }

  if (!services.healthy()) {
    return next(new Error('services unhealthy'))
  }

  if (!session.healthy()) {
    return next(new Error('redis unavailable'))
  }

  return res.status(200).end('OK')
})

app.locals.logger = logger

app.all('*', (req, res, next) => {
  next(not_found(req.path))
})

app.use(errors)

module.exports = app
