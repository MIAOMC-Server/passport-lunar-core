import { appConfig } from '@util/getConfig'
import crypto from 'crypto'

const apiKey = appConfig('INFO_API_KEY', 'string', '')
const apiSecret = appConfig('INFO_API_SECRET', 'string', '')

export const getAPIFullUrl = (method: string, path: string) => {
    const apiEndpoint = appConfig('INFO_API_URL', 'string', '')
    const timestamp = Date.now()
    const salt = crypto.randomBytes(32).toString('hex')
    const signatureString = `${method}${path}${timestamp}${apiSecret}${salt}`

    const token = crypto.createHash('sha256').update(signatureString).digest('hex')
    const fullURL = `${apiEndpoint}${path}?key=${apiKey}&timestamp=${timestamp}&salt=${salt}&token=${token}`

    return {
        token,
        timestamp,
        apiKey,
        salt,
        fullURL
    }
}
