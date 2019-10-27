const http = require('http')

exports.check = options => {
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
