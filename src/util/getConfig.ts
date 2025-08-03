import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

export const appConfig = (configName: string, configType?: 'string' | 'number' | 'boolean') => {
    configName = `APP_${configName}`

    if (!process.env[configName]) {
        console.error(`${configName} is not set`)
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
        return ''
    }
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8')
    return privateKey.trim()
}
export const VerifierPrivateKey = getPrivateKey()

// export const initialConfigs = () => {
//     const expectedConfigs = [
//         { name: 'PORT', type: 'int' },
//         { name: 'DATABASE', type: 'string' },
//         { name: 'JWT_SECRET', type: 'string' },
//         { name: 'JWT_EXPIRATION', type: 'string' },
//         { name: 'JWT_REFRESH_EXPIRATION', type: 'string' },
//         { name: 'JWT_REFRESH_SECRET' , type: 'string' }
//     ]
// }
