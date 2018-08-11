
'use strict'

const {Router} = require('express')

const router = new Router()

router.get('/:key', async (req, res, next) => {
  req.logger.debug(`GET /localization/:key with ${req.param.key}`)
  const client = req.app.locals.pool.connect()
  try {

    const query = 'SELECT * FROM localization.vw_localization WHERE key = $1'
    const {rows} = await client.query(query, [req.param.key])
    return rows

  } catch (err) {

    next(err)

  } finally {

    client.release()

  }
})

module.exports = router
