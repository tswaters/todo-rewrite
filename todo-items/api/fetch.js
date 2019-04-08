const { verify_token } = require('auth-helper')
const pool = require('../lib/pg')
const logger = require('../lib/logger')

module.exports = async payload => {
  const { token } = payload

  let user = null
  try {
    user = await verify_token(token)
  } catch (error) {
    return { status: 401, error: { code: 'TOKEN_INVALID', error } }
  }

  logger.debug('fetch called by %s', user.user_id)

  try {
    const result = await pool.query(
      'SELECT * FROM todo.vw_todos WHERE user_id = $1',
      [user.user_id]
    )

    return { status: 200, result: result.rows }
  } catch (error) {
    return { status: 500, error: { code: 'DATABASE_ERROR', error } }
  }
}
