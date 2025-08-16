import { comparePassword } from '@service/passwordService'
import { createUser, getUserPasswd } from '@service/userService'

interface VerifyUserPasswdReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}
export const verifyUserPasswd = async (
    identifier: string,
    plain_passwd: string,
    type: 'email' | 'username'
): Promise<VerifyUserPasswdReturn> => {
    // 获取用户信息 (UserService:getUserPasswd)
    const user = await getUserPasswd(type, identifier)
    if (!user.status || !user.data) {
        return {
            status: false,
            message: 'User not found'
        }
    }
    // 验证密码 (PasswordService:comparePassword)
    const isMatch = await comparePassword(plain_passwd, user.data.password)
    if (!isMatch.status) {
        return {
            status: false,
            message: 'Invalid password'
        }
    }

    return {
        status: true,
        data: {
            user_id: user.data.id
        }
    }
}

interface RegisterUserReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}
export const registerUser = async (
    email: string,
    username: string,
    plain_passwd: string
): Promise<RegisterUserReturn> => {
    if (!email || !username || !plain_passwd) {
        return {
            status: false,
            message: 'Invalid email, username or password'
        }
    }

    // 创建新用户 (UserService:createUser)
    const user = await createUser(email, username, plain_passwd)
    if (!user.status || !user.data) {
        return {
            status: false,
            message: user.message
        }
    }

    return {
        status: true,
        data: {
            user_id: user.data.user_id
        }
    }
}
