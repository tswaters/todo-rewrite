
'use strict'

const {verify_token} = require('../lib/auth')

module.exports = async (req, res, next) => {
  try {

    const {user} = await verify_token(req.headers.token)

    req.user = user
    req.logger.info(`${user.identifier} authenticated successfully`)

    next()
  } catch (err) {

    next(err)

  }
}
