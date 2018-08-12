
'use strict'

const {Router} = require('express')
const {bad_request} = require('../lib/errors')
const {query} = require('../lib/db')

const router = new Router()

router.post('/fetch', async (req, res, next) => {

  const {keys, locale} = req.body
  req.logger.debug(`POST /localization/fetch with ${locale} and ${keys}`)

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return next(bad_request('keys must be provided'))
  }

  if (!locale || typeof locale !== 'string' || ['en', 'fr'].indexOf(locale) === -1) {
    return next(bad_request('valid locale must be provided'))
  }

  let rows = null
  try {
    ({rows} = await query(
      'SELECT key, value FROM i18n.strings WHERE locale_id = $1 AND key = ANY($2)',
      [req.body.locale, req.body.keys]
    ))
  } catch (err) {
    return next(err)
  }

  res.json(
    rows.reduce((memo, {key, value}) => {
      memo[key] = value
      return memo
    }, {})
  )

})

module.exports = router
