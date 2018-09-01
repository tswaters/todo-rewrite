
'use strict'

const {unauthorized} = require('../lib/errors')

module.exports = async (req, res, next) => {
  try {

    const user = req.session.user

    if (!user) {
      throw unauthorized('must be logged in')
    }

    req.user = user
    next()

  } catch (err) {

    next(err)

  }
}
