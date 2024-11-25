import winston from 'winston'
import VBus from '@/renderer/common/vbus'

const path = require('path')
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

const formatter = winston.format.combine(
  winston.format.json(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    // 输出格式
    // TODO message字段是Symbol对象，对于error级的日志，需要遍历message的Symbol拿到error对象
    const showInfo = {
      user: '',
      time: info.timestamp,
      pid: process.pid,
      level: info.level,
      message: info.message
    }
    VBus.$emit('ADD_MESSAGE_TO_CONTAINER', showInfo)
    return JSON.stringify(showInfo)
  })
)

const transportConsole = new winston.transports.Console({
  format: winston.format.combine(winston.format.prettyPrint(), winston.format.colorize()),
  level: 'debug'
})

const transportFile = new winston.transports.File({
  filename: path.join(process.cwd(), '/log/app.log'),
  level: 'debug',
  maxsize: 1024 * 1024 * 10
})

const logger = winston.createLogger({
  levels,
  format: formatter,
  transports: [
    transportConsole,
    transportFile
  ]
})

export default logger
