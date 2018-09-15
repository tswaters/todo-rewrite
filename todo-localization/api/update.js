
'use strict'

const pool = require('../lib/db')
const logger = require('../lib/logger').child({log_type: 'update'})

module.exports = async msg => {
  const {key, locale, value} = msg
  logger.debug('update localization with %s, %s and %s', key, locale, value)

  if (key == null) {
    return {status: 400, error: {code: 'KEY_NOT_PROVIDED'}}
  }

  if (locale == null) {
    return {status: 400, error: {code: 'LOCALE_NOT_PROVIDED'}}
  }

  if (value == null) {
    return {status: 400, error: {code: 'VALUE_NOT_PROVIDED'}}
  }

  try {

    const result = await pool.query(
      'SELECT i18n.update($1, $2, $3)',
      [key, locale, value]
    )

    if (result.rows.length === 0) {
      return {status: 422, error: {code: 'LOCALIZATION_NOT_UPDATED'}}
    }

    return {status: 200}

  } catch (error) {

    logger.error(error)
    return {status: 500, error: {code: 'DATABASE_ERROR', error}}

  }
}
