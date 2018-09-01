
'use strict'

const {NODE_ENV} = process.env

module.exports = (err, req, res, next) => {

  if (res.headersSent) {
    return next(err)
  }

  const logger = req.logger
    ? req.logger
    : req.app.locals.logger

  if (NODE_ENV === 'production' || err.status !== 500) {
    delete err.stack
    delete err.original
  }

  const {message, stack, original, status = 500} = err

  logger.error(err)
  res.status(status).send({status, message, stack, original})

}
