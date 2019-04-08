'use strict'

const pool = require('../lib/db')
const logger = require('../lib/logger').child({ log_type: 'fetch' })

module.exports = async msg => {
  const { locale } = msg

  logger.debug('fetch localization with %s and %o', locale)

  if (
    !locale ||
    typeof locale !== 'string' ||
    ['en', 'fr'].indexOf(locale) === -1
  ) {
    return { status: 400, error: { code: 'LOCALE_NOT_PROVIDED' } }
  }

  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM i18n.strings WHERE locale_id = $1',
      [locale]
    )

    const result = rows.reduce(
      (memo, { key, value }) => ({ ...memo, [key]: value }),
      {}
    )
    return { status: 200, result }
  } catch (error) {
    logger.error(error)
    return { status: 500, message: error.message, error }
  }
}
