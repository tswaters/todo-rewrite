const { verify_token } = require('auth-helper')
const pool = require('../lib/pg')
const logger = require('../lib/logger')

module.exports = async payload => {
  const { token, text } = payload

  let user = null
  try {
    user = await verify_token(token)
  } catch (error) {
    return { status: 401, error: { code: 'TOKEN_INVALID', error } }
  }

  if (text == null) {
    return { status: 400, error: { code: 'TEXT_NOT_PROVIDED' } }
  }

  logger.debug('create called by by %s with %s', user.user_id, text)

  try {
    const result = await pool.query('SELECT todo.add_todo($1, $2)', [
      user.user_id,
      text,
    ])

    if (result.rows.length === 0) {
      return { status: 422, error: { code: 'TODO_NOT_ADDED' } }
    }

    const { add_todo: todo_id } = result.rows[0]
    return { status: 200, result: { todo_id } }
  } catch (error) {
    return { status: 500, error: { code: 'DATABASE_ERROR', error } }
  }
}
