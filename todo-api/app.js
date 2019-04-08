const express = require('express')
const api = require('./api')
const session = require('./middleware/session')
const errors = require('./middleware/errors')
const loggerMiddleware = require('./middleware/logger')
const i18nMiddleware = require('./middleware/i18n')
const logger = require('./lib/logger')
const { not_found } = require('./lib/errors')

const app = express()
app.use(express.json())
app.use(session.middleware)
app.use(i18nMiddleware(['en'], 'en'))
app.use(loggerMiddleware)
app.use('/api', api)
app.locals.logger = logger
app.all('*', (req, res, next) => {
  next(not_found(req.path))
})
app.use(errors)

module.exports = app
