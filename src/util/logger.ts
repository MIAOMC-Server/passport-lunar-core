import { isJSON } from '@util/commonUtils'
import { appConfig } from '@util/getConfig'

type ArgType = string | object | JSON | boolean | number | null | undefined | unknown

class Loggers {
    private appLogLevel: number
    private appDebug: boolean = appConfig('DEBUG', 'boolean') as boolean
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
            if (this.appDebug === true) {
                return 0
            }
            if (!level || !(level.toUpperCase() in Loggers.levels)) {
                this.log('WARN', 'Logger', `Invalid LOG_LEVEL "${level}", defaulting to "INFO"`)
                return 100
            }
            return this.getLogLevel(level.toUpperCase())
        }

        this.appLogLevel = checkLogLevel()
    }

    getLogLevel(level: string) {
        if (this.appDebug === true) {
            return 0
        }
        if (!(level in Loggers.levels)) {
            this.log('WARN', 'Logger', `Invalid log level "${level}", defaulting to "INFO"`)
            return 100
        }
        return Loggers.levels[level as keyof typeof Loggers.levels]
    }

    typeConvertor(arg: ArgType): string {
        const argType = typeof arg as string

        // 处理 null 和 undefined
        if (arg === null || arg === undefined) {
            return String(arg)
        }

        // 如果为 string 类型，尝试解析为 JSON
        if (argType === 'string') {
            const isJSONResult = isJSON(arg as string)
            return isJSONResult.status ? JSON.stringify(JSON.parse(arg as string)) : (arg as string)
        }

        // 如果为数字或布尔值，直接转换为字符串
        if (['number', 'boolean'].includes(argType)) {
            return String(arg)
        }

        // 如果为对象或 JSON，转换为字符串
        if (argType === 'object') {
            return JSON.stringify(arg)
        }

        // 其他类型，直接转换为字符串
        return String(arg)
    }

    log(level: string, domain: string, message: string, args?: ArgType) {
        const arg = args ? this.typeConvertor(args) : ''

        const logLevel = this.getLogLevel(level)
        if (logLevel < this.appLogLevel) {
            return
        }
        const timestamp = new Date().toISOString()
        const formattedMessage = `[${timestamp}] [${domain}] [${level}] ${message} ${arg ? `\n\nDETAILS: \n${arg}` : ''}`
        const color = Loggers.logColors[level as keyof typeof Loggers.logColors] || '\x1b[0m'
        console.log(color + formattedMessage + '\x1b[0m')
    }

    debug(domain: string, message: string, args?: ArgType) {
        this.log('DEBUG', domain, message, args)
    }

    info(domain: string, message: string, args?: ArgType) {
        this.log('INFO', domain, message, args)
    }

    warn(domain: string, message: string, args?: ArgType) {
        this.log('WARN', domain, message, args)
    }

    error(domain: string, message: string, args?: ArgType) {
        this.log('ERROR', domain, message, args)
    }

    critical(domain: string, message: string, args?: ArgType) {
        this.log('CRITICAL', domain, message, args)
    }
}

export const logger = new Loggers()
