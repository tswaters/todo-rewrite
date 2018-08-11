
const {JWT_SECRET, SESSION_TIMEOUT} = process.env
const jwt = require('jsonwebtoken')
const uuid = require('uuid')
const {unauthorized} = require('./errors')
const NodeCache = require('node-cache')

const valid_tokens = new NodeCache({stdTTL: SESSION_TIMEOUT})

exports.revoke_token = token_id => {
  valid_tokens.del(token_id)
}

exports.sign_token = async user => {

  const token_id = uuid.v4()

  const token = await new Promise((resolve, reject) => jwt.sign(
    {...user, token_id},
    JWT_SECRET,
    (err, result) => err ? reject(err) : resolve(result)
  ))

  valid_tokens.set(token_id, true)

  return {
    success: true,
    token
  }
}

exports.verify_token = async token => {

  if (!token) {
    throw unauthorized('invalid token')
  }

  const {user_id, identifier, roles, token_id} = await new Promise((resolve, reject) => jwt.verify(
    token,
    JWT_SECRET,
    (err, result) => err ? reject(unauthorized('invalid token')) : resolve(result)
  ))

  if (!token_id || !valid_tokens.get(token_id)) {
    throw unauthorized('invalid token')
  } else {
    valid_tokens.ttl(token_id)
  }

  const user = {user_id, identifier, roles}

  return {
    success: true,
    user
  }
}
