
'use strict'

module.exports = (err, req, res, next) => {

  if (res.headersSent) {
    return next(err)
  }

  const logger = req.logger
    ? req.logger
    : req.app.locals.logger

  if (process.env.NODE_ENV === 'production' || err.status !== 500) {
    delete err.stack
  }

  const {message, stack, status = 500} = err

  logger.error(err)
  res.status(status).send({status, message, stack})

}
