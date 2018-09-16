#!/usr/local/bin/node

const port = process.argv.slice(1)[1]
const http = require('http')

const options = {
  host: 'localhost',
  path: '/health',
  port,
  timeout: 2000
}

const request = http.request(options, res => {
  process.stdout.write(`${res.statusCode} - ${res.statusMessage}`)
  process.exit(res.statusCode == 200 ? 0 : 1)
})

request.on('error', err => {
  process.stderr.write(JSON.stringify(err, null, 4))
  process.exit(1)
})

request.end()
