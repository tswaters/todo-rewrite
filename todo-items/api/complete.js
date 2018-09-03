
const {verify_token} = require('auth-helper')
const pool = require('../lib/pg')
const logger = require('../lib/logger')

module.exports = async payload => {

  const {token, todo_id, complete} = payload

  let user = null
  try {
    user = await verify_token(token)
  } catch (error) {
    return {status: 401, message: 'bad token', error}
  }

  if (todo_id == null) {
    return {status: 400, error: 'todo_id must be provided'}
  }

  if (complete == null) {
    return {status: 400, error: 'complete must be provided'}
  }

  logger.debug('complete called by by %s with %s and %s', user.user_id, todo_id, complete)

  try {

    const result = await pool.query(
      'SELECT todo.update_todo_complete($1, $2, $3)',
      [user.user_id, todo_id, complete]
    )

    if (result.rows.length === 0) {
      return {status: 422, error: 'could not complete todo'}
    }

    return {status: 200, result: null}

  } catch (error) {

    return {status: 500, message: 'unexpected error', error}

  }
}
