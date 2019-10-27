'use strict'

const http = require('http')

module.exports = ({ logger, handle_signal = true }) => {
  let checks = {}

  if (handle_signal) {
    process.on('SIGTERM', terminate)
    process.on('SIGINT', terminate)
  }

  let server = null

  const api = { add, create, listen, server, terminate }

  function add(name, checker) {
    checks[name] = checker
    return api
  }

  function create({ path }) {
    server = http.createServer(async (req, res) => {
      if (path && req.url !== path) {
        res.statusCode = 404
        res.statusMessage = 'Not Found'
        return res.end('Not Found')
      }

      let status = 200
      let message = 'OK'
      let statusMessage = 'OK'
      try {
        for (var [name, checker] of Object.entries(checks)) {
          if (!(await checker())) throw new Error(name + ' is unhealthy')
        }
      } catch (err) {
        message = `${name} is unhealthy: ${err.message}`
        statusMessage = 'Not OK'
        status = 500
        logger && logger.warn(name + 'is unhealthy')
      } finally {
        res.statusCode = status
        res.statusMessage = statusMessage
        res.end(message)
      }
    })
    return api
  }

  function listen(port) {
    server &&
      server.listen(port, err => {
        if (err) {
          logger && logger.error(err)
        } else {
          logger && logger.info(`Healthcheck is listening on ${port}`)
        }
      })
  }

  function terminate() {
    logger && logger.info('Healthcheck server is shutting down...')
    server &&
      server.close(
        () => logger && logger.info('Healthcheck server shutdown complete...')
      )
    return api
  }

  return api
}

module.exports.checker = options => {
  const request = http.request(options, res => {
    process.stdout.write(`${res.statusCode} - ${res.statusMessage}`)
    process.exit(res.statusCode === 200 ? 0 : 1)
  })

  request.on('error', err => {
    process.stderr.write(JSON.stringify(err, null, 4))
    process.exit(1)
  })

  request.end()
}
