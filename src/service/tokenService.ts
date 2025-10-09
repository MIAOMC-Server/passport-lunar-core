import { logActivity } from '@repo/commonRepo'
import {
    checkTokenExists,
    insertBindToken,
    insertIntrospectToken,
    readBindToken,
    readIntrospectToken,
    renewIntrospectToken
} from '@repo/tokenRepo'
import { getUser } from '@service/userService'
import { appConfig } from '@util/getConfig'
import { genToken } from '@util/token'

const max_recursion_times = Number(appConfig('MAX_TRY_TIMES', 'number'))

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
            return { status: false, message: 'Error when generating bind token' }
        }
        // 如果令牌已存在，则重执行递归操作重新生成
        if (!(await checkTokenExists(`BT_${newBindToken.data.token}`)).can_do_next) {
            if (recursion?.times && recursion.times > 5) {
                return { status: false, message: 'Error when generating bind token' }
            }
            return genBindToken(bindData, { times: (recursion?.times || 0) + 1 })
        }

        const expire_at = Math.floor(Date.now() / 1000) + 60 * 30

        // 缓存 token 及绑定数据
        await insertBindToken(`BT_${newBindToken.data.token}`, JSON.stringify(bindData), 60 * 30)

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
        if (appConfig('DEBUG', 'boolean', false)) {
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
        const bindDataRaw = await readBindToken(`BT_${token}`)
        if (!bindDataRaw.status || !bindDataRaw.data?.player_uuid) {
            return { status: false, message: '无效的绑定令牌' }
        }

        const bindData = bindDataRaw.data
        await logActivity(null, 'verify', JSON.stringify({ token: token, data: bindData }))

        return { status: true, data: { bindData } }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean', false)) {
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

interface GenIntrospectTokenReturn {
    status: boolean
    message?: string
    data?: {
        relative_with: number
        token: string
        expire_at: number
    }
}

// 已完成拆分
export const genIntrospectToken = async (
    uid: number,
    recursion?: {
        times?: number
    }
): Promise<GenIntrospectTokenReturn> => {
    try {
        const newToken = await genToken(32)
        if (!newToken.status || !newToken.data) {
            return { status: false, message: 'Failed to generate token' }
        }

        // 检查 token 是否已存在，若存在则递归生成 (Repo: checkTokenExists)
        if (!(await checkTokenExists(`IT_${newToken.data.token}`)).can_do_next) {
            if (recursion?.times && recursion.times > max_recursion_times) {
                return { status: false, message: 'Failed to generate token' }
            }
            return genIntrospectToken(uid, { times: (recursion?.times || 0) + 1 })
        }

        // IntrospectToken 到期时间
        const expire_at = Math.floor(Date.now() / 1000) + introspectTokenExpireIn
        const insertResult = await insertIntrospectToken(
            `IT_${newToken.data.token}`,
            String(uid),
            introspectTokenExpireIn
        )

        if (!insertResult.status) {
            return { status: false, message: 'Failed to insert introspect token' }
        }

        await logActivity(
            String(uid),
            'GenIT',
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
        if (appConfig('DEBUG', 'boolean', false)) {
            return { status: false, message: 'internal error: ' + error }
        }
        return { status: false, message: 'Internal Error' }
    }
}

interface VerifyIntrospectTokenReturn {
    status: boolean
    is_renewed: boolean
    message?: string
    data?: object
}
// 已完成拆分
export const verifyIntrospectToken = async (
    token: string
): Promise<VerifyIntrospectTokenReturn> => {
    if (!token.startsWith('IT_')) {
        return { status: false, is_renewed: false, message: 'Invalid Token' }
    }

    const verifiedToken = await readIntrospectToken(token)
    if (!verifiedToken.status || !verifiedToken.data?.related_users_id) {
        return { status: false, is_renewed: false, message: 'Invalid Token' }
    }

    const userInfo = await getUser('id', verifiedToken.data.related_users_id)
    if (!userInfo.status || !userInfo.data) {
        return { status: false, is_renewed: false, message: 'User not found or deleted' }
    }

    let is_renewed = false
    if (verifiedToken.data.exp < 60 * 3) {
        const renewResult = await renewIntrospectToken(token)
        if (renewResult.status) {
            is_renewed = true
        }
        // 代办: 遍历 user:<uid>:introspect_tokens 并删除已失效的 token 注意事项: token 可能会被关联到新的用户，注意检查 value
    }

    return {
        status: true,
        is_renewed,
        message: verifiedToken.data.need_renewal
            ? is_renewed
                ? 'Token has been renewed'
                : 'Error when process Token renewal'
            : 'Token is still valid',
        data: userInfo.data
    }
}

/* End Introspect Token
 * ===================================================================*/
