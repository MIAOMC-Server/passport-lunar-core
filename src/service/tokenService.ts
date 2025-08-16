import { logActivity } from '@repo/commonRepo'
import { getUser } from '@service/userService'
import { cache } from '@util/database'
import { appConfig } from '@util/getConfig'
import { genToken } from '@util/token'

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
        const expire_at = Math.floor(Date.now() / 1000) + 60 * 10
        await cache.set(`IT_${newToken.data.token}`, String(uid), 60 * 10)

        await logActivity(
            String(uid),
            'genIT',
            JSON.stringify({ token: newToken.data.token, expire_at })
        )

        return {
            status: true,
            data: {
                relative_with: uid,
                token: newToken.data.token,
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
    message?: string
    data?: object
}
export const verifyIntrospectToken = async (token: string): Promise<VerifyIntospectTokenReturn> => {
    try {
        const introspectToken = await cache.get(`IT_${token}`)
        if (!introspectToken) {
            return { status: false, message: '无效的 introspect 令牌' }
        }
        const userInfo = await getUser('id', introspectToken)
        if (!userInfo.status || !userInfo.data) {
            return { status: false, message: '用户不存在或已被删除' }
        }

        return { status: true, data: userInfo.data }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, message: 'internal error: ' + error }
        }
        return { status: false, message: 'Internal Error' }
    }
}

/* End Introspect Token
 * ===================================================================*/
