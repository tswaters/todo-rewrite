
const logger = require('../lib/logger')
const {negotiate} = require('../lib/errors')
const {RpcClient} = require('amqp-wrapper')

let login_client = null
let register_client = null

exports.init = async channel => {
  login_client = await RpcClient.build(channel, 'auth-login')
  register_client = await RpcClient.build(channel, 'auth-register')
  login_client.on('error', err => logger.error(err))
  register_client.on('error', err => logger.error(err))
}

exports.register = async payload => {
  const res = await register_client.send(payload)
  if (res.error) {
    throw negotiate(res.error, res.status || 500)
  }
  return res.result
}

exports.login = async payload => {
  const res = await login_client.send(payload)
  if (res.error) {
    throw negotiate(res.error, res.status || 500)
  }
  return res.result
}
