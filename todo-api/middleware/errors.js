'use strict'

const { NODE_ENV } = process.env
const { Err, negotiate } = require('../lib/errors')

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  const logger = req.logger ? req.logger : req.app.locals.logger

  if (!(err instanceof Err)) {
    err = negotiate(err)
  }

  const error = err.toJSON(req.locale)

  if (NODE_ENV === 'production' || error.status !== 500) {
    delete error.stack
    delete error.original
  }

  logger.error(error)
  res.status(error.status).send(error)
}
