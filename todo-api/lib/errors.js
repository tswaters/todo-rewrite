
'use strict'

exports.bad_request = msg => new Err(msg, 400)

exports.unauthorized = msg => new Err(msg, 401)

exports.forbidden = msg => new Err(msg, 403)

exports.not_found = msg => new Err(msg, 404)

exports.unprocessable = msg => new Err(msg, 422)

exports.unhandled = msg => new Err(msg, 500)

class Err extends Error {
  constructor(msg, status) {
    super(msg)
    this.status = status
  }
}
