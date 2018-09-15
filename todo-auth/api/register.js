
'use strict'

const pool = require('../lib/pg')
const logger = require('../lib/logger').child({log_type: 'register'})

module.exports = async msg => {

  const {identifier, password} = msg

  if (identifier == null) {
    return {status: 400, error: {code: 'IDENTIFIER_NOT_PROVIDED'}}
  }

  if (password == null) {
    return {status: 400, error: {code: 'PASSWORD_NOT_PROVIDED'}}
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
      return {status: 401, error: {code: 'INVALID_USER'}}
    }

    logger.info(`Successfully registered ${identifier}`)
    return {status: 200, result: {...rows[0]}}

  } catch (error) {

    // 23505 = unique_violation
    if (error.code === '23505') {
      return {status: 400, error: {code: 'DUPLICATE_USER'}}
    }

    return {status: 500, error: {code: 'DATABASE_ERROR', error}}

  } finally {

    client && client.release()

  }

}
