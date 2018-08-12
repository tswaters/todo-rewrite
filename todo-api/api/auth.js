
const {Router} = require('express')

const {sign_token, revoke_token} = require('../lib/auth')
const {bad_request, unauthorized} = require('../lib/errors')
const {query} = require('../lib/db')

const router = new Router()

const ensure_params = (req, res, next) => {

  const {identifier, password} = req.body

  if (!identifier) {
    return next(bad_request('identifier must be provided'))
  }

  if (!password) {
    return next(bad_request('password must be provided'))
  }

  next()
}

router.post('/logout', (req, res) => {
  revoke_token(req.session.token_id)
  req.session.destroy()
  res.json({success: true})
})

router.post('/register', [ensure_params, async (req, res, next) => {
  try {

    const {identifier, password} = req.body

    req.logger.info(`Received registration request for ${identifier}`)

    let user = null

    try {
      const {rows} = await query(
        'SELECT user_id, roles FROM auth.add_user($1, $2)',
        [identifier, password]
      )

      if (rows.length !== 1) {
        throw unauthorized('invalid username or password')
      }

      const {user_id, roles} = rows[0]
      user = {user_id, identifier, roles}
    } catch (err) {

      // 23505 = unique_violation
      if (err.code === '23505') {
        return next(bad_request('user account already exists'))
      }

      throw err

    }

    req.logger.info(`Successfully registered ${identifier}`)

    const {token, token_id} = await sign_token(user)
    req.session.token_id = token_id
    res.json({success: true, token})

  } catch (err) {

    next(err)

  }
}])

router.post('/login', [ensure_params, async (req, res, next) => {
  try {

    const {identifier, password} = req.body

    req.logger.info(`Received login request from ${identifier}`)

    const {rows} = await query(
      'SELECT user_id, identifier, roles FROM auth.login($1, $2)',
      [identifier, password]
    )

    if (rows.length !== 1) {
      throw unauthorized('invalid username or password')
    }

    const {user_id, roles} = rows[0]
    const user = {user_id, identifier, roles}

    req.logger.info(`Successfully registered ${identifier}`)

    const {token_id, token} = await sign_token(user)

    req.session.token_id = token_id
    res.json({success: true, token})

  } catch (err) {

    next(err)

  }
}])

module.exports = router
