import { logger } from '@util/logger'
import crypto from 'crypto'

interface genTokenReturn {
    status: boolean
    data?: {
        token: string
    }
}
export const genToken = async (length: number = 32): Promise<genTokenReturn> => {
    try {
        const token = await crypto.randomBytes(length).toString('hex')
        return { status: true, data: { token } }
    } catch (error) {
        logger.error('util/token', 'Error generating token:', error)
        return { status: false }
    }
}
