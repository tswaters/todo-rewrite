
const debug = require('debug')('auth-helper')
const {JWT_SECRET = 'magic'} = process.env
const jwt = require('jsonwebtoken')

exports.sign_token = async user => {

  const token = await new Promise(resolve => jwt.sign(
    user,
    JWT_SECRET,
    {expiresIn: '1 minute'},
    (_, result) => resolve(result)
  ))

  debug('signed token for %o', user)

  return token
}

exports.verify_token = async token => {

  if (token == null) {
    throw new Error('invalid token')
  }

  const user = await new Promise((resolve, reject) => jwt.verify(
    token,
    JWT_SECRET,
    (err, result) => err ? reject(new Error('invalid token')) : resolve(result)
  ))

  debug('verified user %o', user)

  return user
}
