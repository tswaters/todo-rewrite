
'use strict'

const {translate} = require('./i18n')

exports.negotiate = (error, status) => {
  const orig = typeof error === 'string' ? null : error
  const code = typeof error === 'string' ? error : error.code
  const err = new Err(code, status || 500)
  if (orig) {
    err.original = orig
    err.stack = `${err.stack}\n\nOriginal Error:\n${orig.stack}`
  }
  return err
}

exports.bad_request = code => new Err(code, 400)

exports.unauthorized = (code = 'UNAUTHORIZED') => new Err(code, 401)

exports.forbidden = (code = 'FORBIDDEN') => new Err(code, 403)

exports.not_found = what => new Err('NOT-FOUND', 404, what)

exports.unprocessable = code => new Err(code, 422)

exports.unhandled = code => new Err(code, 500)

class Err extends Error {

  constructor(code, status, context) {
    super(code)
    this.code = code
    this.status = status
    this.context = context
  }

  toJSON (locale) {
    return {
      code: this.code,
      message:  translate(`ERROR.${this.code}`, locale, this.context),
      stack: this.stack,
      status: this.status
    }
  }

}

exports.Err = Err
