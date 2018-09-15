
'use strict'

const pool = require('../lib/pg')
const logger = require('../lib/logger').child({log_type: 'login'})

module.exports = async msg => {
  let client = null
  try {

    const {identifier, password} = msg

    if (identifier == null) {
      return {status: 400, error: {code: 'IDENTIFIER_NOT_PROVIDED'}}
    }

    if (password == null) {
      return {status: 400, error: {code: 'PASSWORD_NOT_PROVIDED'}}
    }

    logger.info(`Received login request from ${identifier}`)

    client = await pool.connect()

    const {rows} = await client.query(
      'SELECT user_id, identifier, roles FROM auth.login($1, $2)',
      [identifier, password]
    )

    if (rows.length !== 1) {
      return {status: 401, error: {code: 'INVALID_USER'}}
    }

    logger.info(`Successfully logged in ${identifier}`)
    return {status: 200, result: {...rows[0]}}

  } catch (error) {

    return {status: 500, error: {code: 'DATABASE_ERROR', error}}

  } finally {

    client && client.release()

  }

}
