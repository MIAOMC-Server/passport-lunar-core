import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

export const appConfig = (
    configName: string,
    configType?: 'string' | 'number' | 'boolean',
    defaultValue?: string | number | boolean
) => {
    configName = `APP_${configName}`

    if (!process.env[configName]) {
        console.warn(`${configName} is not set using default value: ${defaultValue}`)
        process.env[configName] = String(defaultValue)
    }

    switch (configType) {
        case 'string':
            return process.env[configName] as string
        case 'number':
            return Number(process.env[configName]) as number
        case 'boolean':
            return process.env[configName] === 'true'
        default:
            return process.env[configName]
    }
}

export const getPrivateKey = () => {
    const privateKeyPath = path.join(__dirname, '../../keys/private.key')
    if (!fs.existsSync(privateKeyPath)) {
        console.error('Private key file does not exist at:', privateKeyPath)
        process.exit(1)
    }
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8')
    return privateKey.trim()
}
export const VerifierPrivateKey = getPrivateKey()

export const verifyCriticalConfigs = () => {
    const criticalConfigs = [
        'APP_PORT',
        'APP_SECRET',
        'APP_DATABASE_TYPE',
        'APP_DATABASE_PORT',
        'APP_DATABASE_HOST',
        'APP_DATABASE_NAME',
        'APP_DATABASE_USER',
        'APP_DATABASE_PASSWORD',
        'APP_DATABASE_TABLE_PREFIX',
        'APP_CACHE_TYPE',
        'APP_REDIS_HOST',
        'APP_REDIS_PORT',
        'APP_REDIS_DB'
    ]

    for (const config of criticalConfigs) {
        if (!process.env[config]) {
            console.error(`Critical config ${config} is not set`)
            process.exit(1)
        }
    }
}
