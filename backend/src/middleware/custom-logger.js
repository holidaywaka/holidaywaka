
import pino from 'pino'

const isProduction = process.env.ENVIRONMENT === 'production'

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      level: 'info',
      options: {
        destination: 'logs/combined.log',
        mkdir: true,
        append: true,
        buffer: true,
        minLength: 4096
      }
    },
    ...(!isProduction ? [{
      target: 'pino-pretty', 
      level: 'debug',
      options: {
        colorize: true,
        translateTime: 'SYS:standard' 
      }
    }] : [])
  ]
})

const logger = pino(
  {
    level: isProduction ? 'info' : 'debug',
    base: { env: process.env.ENVIRONMENT, pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
)

export default logger