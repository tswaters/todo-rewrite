
const {Router} = require('express')

const {bad_request} = require('../lib/errors')
const {login, register} = require('../services/auth')

const router = new Router()

const ensure_params = (req, res, next) => {

  const {identifier, password} = req.body

  if (!identifier) {
    return next(bad_request('IDENTIFIER_NOT_PROVIDED'))
  }

  if (!password) {
    return next(bad_request('PASSWORD_NOT_PROVIDED'))
  }

  next()
}

router.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({success: true})
})

router.post('/register', [ensure_params, async (req, res, next) => {
  try {

    const {identifier, password} = req.body
    req.logger.info(`Received registration request for ${identifier}`)

    const user = await register({identifier, password})
    req.logger.info(`${identifier} successfully registered`)
    req.session.user = user
    res.json({success: true})

  } catch (err) {

    next(err)

  }
}])

router.post('/login', [ensure_params, async (req, res, next) => {
  try {

    const {identifier, password} = req.body
    req.logger.info(`Received login request from ${identifier}`)

    const user = await login({identifier, password})
    req.logger.info(`${identifier} successfully logged in`)
    req.session.user = user
    res.json({success: true})

  } catch (err) {

    next(err)

  }
}])

module.exports = router
