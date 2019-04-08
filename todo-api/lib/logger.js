const pino = require('pino')
const chalk = require('chalk')

const { LOG_LEVEL: level = 'debug' } = process.env

const ctx = new chalk.constructor()

const levels = {
  default: 'USER',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE',
}

const levelColors = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey,
}

let transform = null

if (process.env.NODE_ENV === 'development') {
  transform = pino.pretty({
    formatter: value => {
      let time = new Date().toJSON()
      time = ctx.gray(time)

      const logLevel = levelColors[value.level](levels[value.level].padEnd(5))

      let type = value.log_type ? value.log_type : 'app'
      type = ctx.white(type.padEnd(7))

      const msg = value.msg ? ctx.cyan(value.msg) : value.message
      const stack =
        value.type === 'Error' && value.stack ? `\n${value.stack}` : ''

      return `${time} ${logLevel} ${type} ${msg} ${stack}`
    },
  })
  transform.pipe(process.stdout)
}

module.exports = pino({ level }, transform)
