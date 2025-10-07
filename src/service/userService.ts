import { checkUserExists, insertUser, readUserInfo, readUserPasswd } from '@repo/userRepo'
import { logger } from '@util/logger'

interface CreateUserReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}
export const createUser = async (
    email: string,
    username: string,
    passwd: string
): Promise<CreateUserReturn> => {
    try {
        // 检查邮箱，用户名可用性
        const checkForExists = await checkUserExists({ email, username })

        const checkResult = checkForExists.data ?? {
            is_email_exists: false,
            is_username_exists: false
        }

        if (!checkForExists.status || !checkForExists.can_do_next) {
            return {
                status: false,
                message:
                    checkResult.is_email_exists && checkResult.is_username_exists
                        ? 'Email and username are already taken'
                        : checkResult.is_email_exists
                          ? 'Email is already taken'
                          : 'Username is already taken'
            }
        }
        // 创建新用户(repo:insertUser)
        const newUserId = await insertUser(email, username, passwd)

        if (!newUserId.status || newUserId.data?.user_id === null) {
            return {
                status: false,
                message: newUserId.message || 'Failed to create user'
            }
        }

        return {
            status: true,
            data: {
                user_id: newUserId.data!.user_id
            }
        }
    } catch (error) {
        logger.error('service/UserService', 'Error creating user:', error)
        return {
            status: false,
            message: `Failed to create user`
        }
    }
}

interface GetUserReturn {
    status: boolean
    message?: string
    data?: {
        id: number
        email: string
        username: string
        nickname: string
        global_role: string
        created_at: number
    }
}
export const getUser = async (
    getType: 'id' | 'email' | 'username',
    value: string
): Promise<GetUserReturn> => {
    try {
        // 获取用户信息 (repo:readUserInfo)
        const userInfo = await readUserInfo(getType, value)

        if (!userInfo.status || !userInfo.data) {
            return {
                status: false,
                message: userInfo.message || 'Failed to get user'
            }
        }

        return {
            status: true,
            data: {
                id: userInfo.data.id,
                email: userInfo.data.email,
                username: userInfo.data.username,
                nickname: userInfo.data.nickname,
                global_role: userInfo.data.global_role,
                created_at: userInfo.data.created_at
            }
        }
    } catch (error) {
        logger.error('service/UserService', 'Error getting user:', error)
        return {
            status: false,
            message: `Failed to get user`
        }
    }
}

interface GetUserPasswdReturn {
    status: boolean
    message?: string
    data?: {
        id: number
        password: string
    }
}
export const getUserPasswd = async (
    type: 'username' | 'email',
    value: string
): Promise<GetUserPasswdReturn> => {
    try {
        // 获取用户密码 (repo:readUserPasswd)
        const userInfo = await readUserPasswd(type, value)
        if (!userInfo.status || !userInfo.data) {
            return {
                status: false,
                message: userInfo.message || 'Failed to get user password'
            }
        }

        return {
            status: true,
            data: {
                id: userInfo.data.id,
                password: userInfo.data.password
            }
        }
    } catch (error) {
        logger.error('service/UserService', 'Error getting user password:', error)
        return {
            status: false,
            message: `Failed to get user password`
        }
    }
}
