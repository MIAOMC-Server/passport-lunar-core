import { cache } from '@util/database'
import { appConfig } from '@util/getConfig'

interface ReadToken {
    status: boolean
    message?: string
    data?: {
        exp: number
        need_renewal: boolean
        related_users_id: string
    }
}

export const readToken = async (token: string): Promise<ReadToken> => {
    try {
        const data = await cache.get(`${token}`)

        if (!data) {
            return { status: false, message: 'Token not found' }
        }

        const ttl = await cache.getTTL(`${token}`)
        if (!ttl) {
            return { status: false, message: 'Failed to get token TTL' }
        }

        const is_need_renew = ttl < 60 * 3 ? true : false

        return {
            status: true,
            data: {
                exp: ttl,
                need_renewal: is_need_renew,
                related_users_id: data
            }
        }
    } catch (err) {
        if (appConfig('DEBUG', 'boolean')) {
            console.error('Error reading introspect token:', err)
            return { status: false, message: `readIntrospectToken: ${err}` }
        }
        return { status: false, message: 'Failed to read introspect token' }
    }
}

interface InsertTokenReturn {
    status: boolean
    message?: string
}
export const insertToken = async (
    it: string,
    uid: string,
    data: string = uid,
    exp: number | null = null
): Promise<InsertTokenReturn> => {
    try {
        await cache.set(it, data, exp)
        await cache.sAdd(`user:${uid}:introspect_tokens`, it)
        return {
            status: true
        }
    } catch (err) {
        if (appConfig('DEBUG', 'boolean')) {
            console.error('Error inserting introspect token:', err)
            return { status: false, message: `insertIntrospectToken: ${err}` }
        }
        return { status: false, message: 'Failed to insert introspect token' }
    }
}

export const insertIntrospectToken = async (
    it: string,
    uid: string,
    exp: number | null = null
): Promise<InsertTokenReturn> => {
    return insertToken(it, uid, uid, exp)
}

interface CheckTokenExistsReturn {
    status: boolean
    can_do_next: boolean
    message?: string
}
export const checkTokenExists = async (token: string): Promise<CheckTokenExistsReturn> => {
    try {
        const result = await cache.get(token)
        if (result) {
            return { status: true, can_do_next: false, message: 'Token exists' }
        }
        return { status: true, can_do_next: true }
    } catch (err) {
        if (appConfig('DEBUG', 'boolean')) {
            console.error('Error when checking tokens', err)
            return {
                status: false,
                can_do_next: false,
                message: `checkTokenExists: ${err}`
            }
        }
        return { status: false, can_do_next: false, message: 'Error when checking tokens' }
    }
}
