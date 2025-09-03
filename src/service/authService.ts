import { insertMailVerificationCode, readMailVerificationCode } from '@repo/tokenRepo'
import { sendVerificationCode } from '@service/mailService'
import { comparePassword } from '@service/passwordService'
import { createUser, getUserPasswd } from '@service/userService'
import { checkEmpty } from '@util/commonUtils'
import { genToken } from '@util/token'

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

interface VerifyUserEmail {
    status: boolean
    message?: string
}

export const verifyUserEmail = async (
    type: 'verify' | 'send-code',
    email: string,
    username: string,
    code?: string
): Promise<VerifyUserEmail> => {
    if (checkEmpty(type, email).status) return { status: false, message: 'Invalid parameters' }

    switch (type) {
        case 'verify': {
            if (checkEmpty(code).status) return { status: false, message: 'Invalid parameters' }

            const checkCodeResult = await readMailVerificationCode(code!)
            if (!checkCodeResult.status || checkCodeResult.data?.email !== email)
                return { status: false, message: 'Invalid verification code' }

            return { status: true }
            break
        }
        case 'send-code': {
            const verifyCode = await genToken(6)
            if (!verifyCode.status || !verifyCode.data?.token)
                return { status: false, message: 'Failed to generate verification code' }

            const insertCodeResult = await insertMailVerificationCode(email, verifyCode.data.token)
            if (!insertCodeResult.status)
                return { status: false, message: 'Failed to insert verification code' }

            const sendCodeResult = await sendVerificationCode(
                email,
                username,
                verifyCode.data.token,
                5
            )
            if (!sendCodeResult.status) return { status: false, message: 'Email sending failed' }

            return { status: true }
        }
    }
}
