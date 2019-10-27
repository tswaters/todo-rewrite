const logger = require('../lib/logger').child({ logType: 'i18n-service' })
const { negotiate } = require('../lib/errors')
const { RpcClient, Subscriber } = require('amqp-wrapper')
const { init: init_keys, update } = require('../lib/i18n')

let fetch_client = null
let update_client = null
let localization_update = null

exports.init = async channel => {
  fetch_client = await RpcClient.build(channel, 'i18n-fetch')
  update_client = await RpcClient.build(channel, 'i18n-update')
  localization_update = await Subscriber.build(
    channel,
    'i18n-update-fanout',
    msg => {
      const { key, locale, value } = msg
      logger.debug(
        'got fanout message, updated %s to %s for %s',
        key,
        value,
        locale
      )
      update(key, locale, value)
    }
  )

  localization_update.on('error', err => logger.error(err))
  fetch_client.on('error', err => logger.error(err))
  update_client.on('error', err => logger.error(err))

  let tid = null
  let fetch_keys = async () => {
    logger.info('Attempting to fetch keys')
    const keys = await exports.fetch({ locale: 'en' })
    init_keys('en', keys)
  }

  try {
    await fetch_keys()
  } catch (err) {
    tid = setInterval(async () => {
      try {
        await fetch_keys()
        clearInterval(tid)
      } catch (err) {
        logger.error(err)
      }
    }, 2000)
  }

  const close = () => clearInterval(tid)
  process.on('SIGTERM', close)
  process.on('SIGINT', close)
}

exports.update = async payload => {
  const res = await update_client.send(payload)
  if (res.error) {
    throw negotiate(res.error, res.status || 500)
  }
  return res.result
}

exports.fetch = async payload => {
  const res = await fetch_client.send(payload)
  if (res.error) {
    throw negotiate(res.error, res.status || 500)
  }
  return res.result
}
