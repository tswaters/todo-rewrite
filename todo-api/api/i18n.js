
'use strict'

const {Router} = require('express')
const authentication = require('../middleware/authentication')
const authorization = require('../middleware/authorization')
const {bad_request} = require('../lib/errors')
const localization = require('../services/i18n')

const router = new Router()

router.get('/', async (req, res, next) => {

  const {locale} = req.query

  req.logger.debug('GET /i18n/')

  if (!locale || typeof locale !== 'string' || ['en', 'fr'].indexOf(locale) === -1) {
    return next(bad_request('LOCALE_NOT_PROVIDED'))
  }

  try {
    const result = await localization.fetch({locale})
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.put('/:key', [authentication, authorization('ADMIN'), async (req, res, next) => {

  const {key} = req.params
  const {locale, value} = req.body

  req.logger.debug('PUT /i18n/%s/', key)

  if (value == null) {
    return next(bad_request('VALUE_NOT_PROVIDED'))
  }

  if (locale == null) {
    return next(bad_request('LOCALE_NOT_PROVIDED'))
  }

  try {
    await localization.update({key, locale, value})
    res.json({success: true})
  } catch (err) {
    next(err)
  }
}])


module.exports = router
