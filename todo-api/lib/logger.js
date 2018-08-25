
const pino = require('pino')
const chalk = require('chalk')

const {LOG_LEVEL: level = 'debug'} = process.env

const ctx = new chalk.constructor()

const levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
}

const levelColors = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey
}

let transform = null

if (process.env.NODE_ENV === 'development') {
  transform = pino.pretty({
    formatter: value => {
      const time = new Date().toJSON()
      const sid = ctx.white((value.sid ? value.sid : '').padEnd(32))
      const logLevel = levelColors[value.level](levels[value.level].padEnd(7))

      let user = value.connection_id ? value.connection_id : `${' '.repeat(16)}anon${' '.repeat(16)}`
      user = ctx.white(user)

      let type = value.type ? value.type : 'app'
      if (type === 'Error') { type = (value.status || 500).toString() }
      type = ctx.white(type.padEnd(7))

      const msg = value.msg ? ctx.cyan(value.msg) : ''
      const stack = value.type === 'Error' && value.stack && !value.status ? `\n${value.stack}` : ''
      return `${time} ${sid} (${user}) ${logLevel}${type}${msg}${stack}`
    }
  })
  transform.pipe(process.stdout)
}

const logger = pino({}, transform)

logger.level = level

module.exports = logger
