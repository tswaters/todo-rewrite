
const logger = require('../lib/logger')

module.exports = (req, res, next) => {

  req.logger = logger.child({
    connection_id: req.connection.id,
    sid: req.session.id,
    type: 'app'
  })

  next()
}
