import { cache } from '@util/database'
import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'
import { error } from 'console'

const introspectTokenExpireIn = Number(appConfig('TOKEN_INTROSPECT_EXPIRE', 'number'))

interface ReadTokenReturn {
    status: boolean
    message?: string
    data?: object
}

export const readToken = async (token: string): Promise<ReadTokenReturn> => {
    try {
        const data = await cache.get(`${token}`)

        if (!data) {
            return { status: false, message: 'Token not found' }
        }

        const ttl = await cache.getTTL(`${token}`)

        const structureReturnData = {
            ...JSON.parse(data),
            ttl: ttl ? ttl : null
        }

        return {
            status: true,
            data: structureReturnData
        }
    } catch (err) {
        logger.error('repo/TokenRepo', 'Error reading introspect token:', error)
        if (appConfig('DEBUG', 'boolean', false))
            return { status: false, message: `readIntrospectToken: ${err}` }

        return { status: false, message: 'Failed to read introspect token' }
    }
}

interface ReadIntrospectTokenReturn {
    status: boolean
    message?: string
    data?: {
        exp: number
        need_renewal: boolean
        related_users_id: string
    }
}

export const readIntrospectToken = async (token: string): Promise<ReadIntrospectTokenReturn> => {
    try {
        const dataRaw = await readToken(token)
        if (!dataRaw.status || !dataRaw.data) {
            return { status: false, message: dataRaw.message || 'Token not found' }
        }

        const data = dataRaw.data as { ttl: number | null; related_users_id: string }
        if (!data.ttl || !data.related_users_id) {
            return { status: false, message: 'Failed to get token details' }
        }

        return {
            status: true,
            data: {
                exp: data.ttl,
                need_renewal: data.ttl < 60 * 3,
                related_users_id: data.related_users_id
            }
        }
    } catch (error) {
        logger.error('repo/TokenRepo', 'Error reading introspect token:', error)
        if (appConfig('DEBUG', 'boolean', false))
            return { status: false, message: `readIntrospectToken: ${error}` }

        return { status: false, message: 'Failed to read introspect token' }
    }
}

interface ReadBindTokenReturn {
    status: boolean
    message?: string
    data?: {
        player_uuid: string
    }
}

export const readBindToken = async (token: string): Promise<ReadBindTokenReturn> => {
    try {
        const dataRaw = await readToken(token)
        if (!dataRaw.status || !dataRaw.data) {
            return { status: false, message: dataRaw.message || 'Token not found' }
        }

        const { player_uuid } = dataRaw.data as { player_uuid: string }
        if (!player_uuid) {
            return { status: false, message: 'Failed to get player UUID' }
        }

        return { status: true, data: { player_uuid } }
    } catch (error) {
        logger.error('repo/TokenRepo', 'Error reading bind token:', error)
        if (appConfig('DEBUG', 'boolean', false))
            return { status: false, message: `readBindToken: ${error}` }

        return { status: false, message: 'Failed to read bind token' }
    }
}

//=======================================================

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
    } catch (error) {
        logger.error('repo/TokenRepo', 'Error inserting introspect token:', error)
        if (appConfig('DEBUG', 'boolean', false))
            return { status: false, message: `insertIntrospectToken: ${error}` }

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

export const insertBindToken = async (
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
    } catch (error) {
        logger.error('repo/TokenRepo', 'Error when checking tokens:', error)
        if (appConfig('DEBUG', 'boolean', false))
            return {
                status: false,
                can_do_next: false,
                message: `checkTokenExists: ${error}`
            }

        return { status: false, can_do_next: false, message: 'Error when checking tokens' }
    }
}

interface RenewIntrospectTokenReturn {
    status: boolean
    need_refresh: boolean
    message?: string
    data?: {
        token: string
        expire_at: number
    }
}

export const renewIntrospectToken = async (token: string): Promise<RenewIntrospectTokenReturn> => {
    try {
        const expire_at = Math.floor(Date.now() / 1000) + introspectTokenExpireIn
        // 传入 TTL（秒）
        await cache.renew(token, introspectTokenExpireIn)

        return {
            status: true,
            need_refresh: false,
            data: {
                token,
                expire_at
            }
        }
    } catch (err) {
        if (appConfig('DEBUG', 'boolean', false)) {
            return { status: false, need_refresh: false, message: 'internal error: ' + err }
        }
        return { status: false, need_refresh: false, message: 'Internal Error' }
    }
}

interface InsertMailVerificationCodeReturn {
    status: boolean
    message?: string
}
export const insertMailVerificationCode = async (
    email: string,
    code: string
): Promise<InsertMailVerificationCodeReturn> => {
    try {
        // 插入邮箱验证码到缓存，5分钟
        await cache.set(`MT_${code}`, email, 60 * 50)
        return { status: true }
    } catch (err) {
        return {
            status: false,
            message: appConfig('DEBUG', 'boolean', false)
                ? (err as string)
                : 'Error when insert verify code'
        }
    }
}

interface ReadMailVerificationCodeReturn {
    status: boolean
    message?: string
    data?: { email: string }
}
export const readMailVerificationCode = async (
    code: string
): Promise<ReadMailVerificationCodeReturn> => {
    try {
        const email = await cache.get(`MT_${code}`)
        if (!email) {
            return {
                status: false,
                message: 'Verification code not found'
            }
        }
        return {
            status: true,
            data: { email }
        }
    } catch (err) {
        return {
            status: false,
            message: appConfig('DEBUG', 'boolean', false)
                ? (err as string)
                : 'Error when reading verify code'
        }
    }
}
