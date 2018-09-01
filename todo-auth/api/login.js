
'use strict'

const pool = require('../lib/pg')
const logger = require('../lib/logger').child({log_type: 'login'})

module.exports = async msg => {
  let client = null
  try {

    const {identifier, password} = msg

    if (identifier == null) {
      return {status: 400, error: 'identifier must be provided'}
    }

    if (password == null) {
      return {status: 400, error: 'password must be provided'}
    }

    logger.info(`Received login request from ${identifier}`)

    client = await pool.connect()

    const {rows} = await client.query(
      'SELECT user_id, identifier, roles FROM auth.login($1, $2)',
      [identifier, password]
    )

    if (rows.length !== 1) {
      return {status: 401, error: 'invalid username or password'}
    }

    logger.info(`Successfully logged in ${identifier}`)
    return {status: 200, result: {...rows[0]}}

  } catch (error) {

    return {status: 500, message: 'unexpected error', error}

  } finally {

    client && client.release()

  }

}
