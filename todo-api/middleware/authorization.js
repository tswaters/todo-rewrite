'use strict'

const { unauthorized, forbidden } = require('../lib/errors')

module.exports = roles => (req, res, next) => {
  if (!req.user) {
    return next(unauthorized())
  }

  if (!Array.isArray(req.user.roles) || req.user.roles.length === 0) {
    return next(forbidden())
  }

  if (req.user.roles.includes('ADMIN')) {
    req.logger.info(`${req.user.identifier} authorized successfully as ADMIN`)
    return next()
  }

  const authorized = roles.reduce((memo, role) => {
    if (memo) {
      return memo
    }
    if (req.user.roles.includes(role)) {
      return true
    }
    return false
  }, false)

  if (!authorized) {
    return next(forbidden())
  }

  req.logger.info(
    `${req.user.identifier} authorized successfully as {${roles.join(',')}}`
  )

  next()
}
