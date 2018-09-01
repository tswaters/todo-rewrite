
'use strict'

const pool = require('../lib/pg')
const logger = require('../lib/logger').child({log_type: 'register'})

module.exports = async msg => {

  const {identifier, password} = msg

  if (identifier == null) {
    return {status: 400, error: 'identifier must be provided'}
  }

  if (password == null) {
    return {status: 400, error: 'password must be provided'}
  }

  logger.info(`Received registration request for ${identifier}`)

  let client = null

  try {
    client = await pool.connect()

    const {rows} = await client.query(
      'SELECT user_id, roles FROM auth.add_user($1, $2)',
      [identifier, password]
    )

    if (rows.length !== 1) {
      return {status: 401, error: 'invalid username or password'}
    }

    logger.info(`Successfully registered ${identifier}`)
    return {status: 200, result: {...rows[0]}}

  } catch (error) {

    // 23505 = unique_violation
    if (error.code === '23505') {
      return {status: 400, error: 'user account already exists'}
    }

    return {status: 500, message: 'unexpected error', error}

  } finally {

    client && client.release()

  }

}
