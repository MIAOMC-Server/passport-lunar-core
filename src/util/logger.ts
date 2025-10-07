import { isJSON } from '@util/commonUtils'
import { appConfig } from '@util/getConfig'

class Loggers {
    private appLogLevel: number
    private static levels = { CRITICAL: 1000, ERROR: 900, WARN: 800, INFO: 100, DEBUG: 0 }
    private static logColors = {
        CRITICAL: '\x1b[35m',
        ERROR: '\x1b[31m',
        WARN: '\x1b[33m',
        INFO: '\x1b[32m',
        DEBUG: '\x1b[34m'
    }

    constructor() {
        const checkLogLevel = () => {
            const level = appConfig('LOG_LEVEL', 'string') as string
            if (!level || !(level.toUpperCase() in Loggers.levels)) {
                return 100
            }
            return this.getLogLevel(level.toUpperCase())
        }

        this.appLogLevel = checkLogLevel()
    }

    getLogLevel(level: string) {
        if (!(level in Loggers.levels)) {
            return 100
        }
        return Loggers.levels[level as keyof typeof Loggers.levels]
    }

    log(level: string, domain: string, message: string, args?: string) {
        const arg = isJSON(args || '').status ? JSON.stringify(JSON.parse(args || '')) : args

        const logLevel = this.getLogLevel(level)
        if (logLevel < this.appLogLevel) {
            return
        }
        const timestamp = new Date().toISOString()
        const formattedMessage = `[${timestamp}] [${domain}] [${level}] ${message} ${'\n\nDETAILS: \n' + arg || ''}`
        const color = Loggers.logColors[level as keyof typeof Loggers.logColors] || '\x1b[0m'
        console.log(color + formattedMessage + '\x1b[0m')
    }

    debug(domain: string, message: string, args?: string) {
        this.log('DEBUG', domain, message, args)
    }

    info(domain: string, message: string, args?: string) {
        this.log('INFO', domain, message, args)
    }

    warn(domain: string, message: string, args?: string) {
        this.log('WARN', domain, message, args)
    }

    error(domain: string, message: string, args?: string) {
        this.log('ERROR', domain, message, args)
    }

    critical(domain: string, message: string, args?: string) {
        this.log('CRITICAL', domain, message, args)
    }
}

export const logger = new Loggers()
