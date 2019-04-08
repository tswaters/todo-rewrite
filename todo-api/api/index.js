const { Router } = require('express')

const i18n = require('./i18n')
const todo = require('./todo')
const auth = require('./auth')

const router = new Router()
router.use('/i18n', i18n)
router.use('/todo', todo)
router.use('/auth', auth)
module.exports = router
