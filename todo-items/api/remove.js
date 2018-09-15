
const {verify_token} = require('auth-helper')
const pool = require('../lib/pg')
const logger = require('../lib/logger')

module.exports = async payload => {

  const {token, todo_id} = payload

  let user = null
  try {
    user = await verify_token(token)
  } catch (error) {
    return {status: 401, error: {code: 'TOKEN_INVALID', error}}
  }

  if (todo_id == null) {
    return {status: 400, error: {code: 'TODO_ID_NOT_PROVIDED'}}
  }

  logger.debug('remove called by by %s with %s', user.user_id, todo_id)

  try {
    const result = await pool.query(
      'SELECT todo.update_todo_delete($1, $2, $3)',
      [user.user_id, todo_id, true]
    )

    if (result.rows.length === 0) {
      return {status: 422, error: {code: 'TODO_NOT_DELETED'}}
    }

    return {status: 200, result: null}

  } catch (error) {

    return {status: 500, error: {code: 'DATABASE_ERROR', error}}

  }
}
