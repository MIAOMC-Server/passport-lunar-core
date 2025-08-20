import { logActivity } from '@repo/commonRepo'
import { getUser } from '@service/userService'
import { cache } from '@util/database'
import { appConfig } from '@util/getConfig'
import { genToken } from '@util/token'

/*
 * 代办:
 *   1.拆分缓存逻辑到Repo中
 */

/* ===================================================================
 * Start Bind Token*/

interface GenBindTokenReturn {
    status: boolean
    message?: string
    data?: {
        token: string
        expire_at: number
    }
}
export const genBindToken = async (
    bindData: object,
    recursion?: {
        times?: number
    }
): Promise<GenBindTokenReturn> => {
    try {
        const newBindToken = await genToken(32)
        if (!newBindToken.status || !newBindToken.data) {
            return { status: false, message: '生成绑定令牌失败' }
        }
        // 如果令牌已存在，则重执行递归操作重新生成
        if (await cache.get(`BT_${newBindToken.data.token}`)) {
            if (recursion?.times && recursion.times > 5) {
                return { status: false, message: '生成绑定令牌失败' }
            }
            return genBindToken(bindData, { times: (recursion?.times || 0) + 1 })
        }

        const expire_at = Math.floor(Date.now() / 1000) + 60 * 30

        // 缓存 token 及绑定数据
        await cache.set(`BT_${newBindToken.data.token}`, JSON.stringify(bindData), 60 * 30)

        await logActivity(
            null,
            'bind',
            JSON.stringify({ token: newBindToken.data.token, data: bindData })
        )

        return {
            status: true,
            data: {
                token: newBindToken.data.token,
                expire_at
            }
        }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, message: 'internal error: ' + error }
        }
        return { status: false, message: 'Internal Error' }
    }
}

interface VerifyBindTokenReturn {
    status: boolean
    message?: string
    data?: {
        bindData: object
    }
}
export const verifyBindToken = async (token: string): Promise<VerifyBindTokenReturn> => {
    try {
        const bindData = await cache.get(`BT_${token}`)
        if (!bindData) {
            return { status: false, message: '无效的绑定令牌' }
        }
        await logActivity(null, 'verify', JSON.stringify({ token: token, data: bindData }))
        return { status: true, data: { bindData: JSON.parse(bindData) } }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, message: 'internal error: ' + error }
        }
        return { status: false, message: 'Internal Error' }
    }
}

/* End Bind Token
 * ===================================================================*/

/* ====================================================================
 * Start Introspect Token*/

const introspectTokenExpireIn = Number(appConfig('TOKEN_INTROSPECT_EXPIRE', 'number'))

interface genIntrospectTokenReturn {
    status: boolean
    message?: string
    data?: {
        relative_with: number
        token: string
        expire_at: number
    }
}

export const genIntrospectToken = async (
    uid: number,
    recursion?: {
        times?: number
    }
): Promise<genIntrospectTokenReturn> => {
    try {
        const newToken = await genToken(32)
        if (!newToken.status || !newToken.data) {
            return { status: false, message: '生成 introspect token 失败' }
        }

        // 检查 token 是否已存在，若存在则递归生成
        if (await cache.get(`IT_${newToken.data.token}`)) {
            if (recursion?.times && recursion.times > 5) {
                return { status: false, message: '生成 introspect token 失败' }
            }
            return genIntrospectToken(uid, { times: (recursion?.times || 0) + 1 })
        }

        // IntrospectToken 10 分钟到期
        const expire_at = Math.floor(Date.now() / 1000) + introspectTokenExpireIn
        await cache.set(`IT_${newToken.data.token}`, String(uid), introspectTokenExpireIn)

        await logActivity(
            String(uid),
            'genIT',
            JSON.stringify({ token: newToken.data.token, expire_at })
        )

        return {
            status: true,
            data: {
                relative_with: uid,
                token: `IT_${newToken.data.token}`,
                expire_at
            }
        }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, message: 'internal error: ' + error }
        }
        return { status: false, message: 'Internal Error' }
    }
}

interface VerifyIntospectTokenReturn {
    status: boolean
    is_renewed: boolean
    message?: string
    data?: object
}
export const verifyIntrospectToken = async (token: string): Promise<VerifyIntospectTokenReturn> => {
    if (!token.startsWith('IT_')) {
        return { status: false, is_renewed: false, message: '无效的 introspect 令牌' }
    }
    try {
        const introspectToken = await cache.get(`${token}`)
        if (!introspectToken) {
            return { status: false, is_renewed: false, message: '无效的 introspect 令牌' }
        }
        const userInfo = await getUser('id', introspectToken)
        if (!userInfo.status || !userInfo.data) {
            return { status: false, is_renewed: false, message: '用户不存在或已被删除' }
        }

        // 代办: 设置一个阈值，有效期小于阈值才执行Token续期
        const renewResult = await renewIntrospectToken(token)
        if (renewResult.status) {
            return { status: true, is_renewed: true, data: userInfo.data }
        }

        return {
            status: true,
            is_renewed: false,
            message: 'Error when process Token renewal',
            data: userInfo.data
        }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, is_renewed: false, message: 'internal error: ' + error }
        }
        return { status: false, is_renewed: false, message: 'Internal Error' }
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
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, need_refresh: false, message: 'internal error: ' + err }
        }
        return { status: false, need_refresh: false, message: 'Internal Error' }
    }
}

/* End Introspect Token
 * ===================================================================*/
