import { comparePassword } from '@service/passwordService'
import { getUserPasswd } from '@service/userService'

interface VerifyUserPasswdReturn {
    status: boolean
    message?: string
}
export const verifyUserPasswd = async (
    user_id: string,
    plain_passwd: string
): Promise<VerifyUserPasswdReturn> => {
    const user = await getUserPasswd(user_id)
    if (!user.status || !user.data) {
        return {
            status: false,
            message: 'User not found'
        }
    }

    const isMatch = await comparePassword(plain_passwd, user.data.password)
    if (!isMatch) {
        return {
            status: false,
            message: 'Invalid password'
        }
    }

    return {
        status: true
    }
}
