const logger = require('../lib/logger')
const { negotiate } = require('../lib/errors')
const { RpcClient } = require('amqp-wrapper')

exports.init = async channel =>
  Promise.all(
    ['fetch', 'create', 'complete', 'update', 'remove', 'restore'].map(
      async thing => {
        const client = await RpcClient.build(channel, `items-${thing}`)
        client.on('error', err => logger.error(err))

        exports[thing] = async payload => {
          const res = await client.send(payload)
          if (res.error) {
            throw negotiate(res.error, res.status || 500)
          } else {
            return res.result
          }
        }
      }
    )
  )
