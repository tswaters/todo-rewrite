
const {Router} = require('express')

const localization = require('./localization')
const todo = require('./todo')
const auth = require('./auth')

const router = new Router()
router.use('/localization', localization)
router.use('/todo', todo)
router.use('/auth', auth)
module.exports = router
