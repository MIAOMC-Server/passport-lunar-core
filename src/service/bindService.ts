import { registerUser, verifyUserEmail, verifyUserPasswd } from '@service/authService'
import { checkEmpty } from '@util/commonUtils'

interface BindWithNewAccountReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}
export const bindWithNewAccount = async (
    type: 'send' | 'create',
    email: string,
    username: string,
    password?: string,
    code?: string
): Promise<BindWithNewAccountReturn> => {
    if (checkEmpty(email, username).status) return { status: false, message: 'Invalid parameters' }

    if (type === 'send') {
        const sendResult = await verifyUserEmail('send-code', email, username)

        if (!sendResult.status) return { status: false }

        return { status: true }
    }

    if (checkEmpty(password, code).status) return { status: false, message: 'Invalid parameters' }

    const verifyResult = await verifyUserEmail('verify', email, username, code)
    if (!verifyResult.status) return { status: false, message: 'Invalid Code' }

    const createUser = await registerUser(email, username, password!)
    if (!createUser.status || !createUser.data?.user_id)
        return {
            status: false,
            message: createUser.message || 'Error when processing your request'
        }

    return { status: true, data: { user_id: createUser.data.user_id } }
}

interface BindWithExistAccountReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}

export const bindWithExistAccount = async (
    email: string,
    password: string
): Promise<BindWithExistAccountReturn> => {
    if (checkEmpty(email, password).status) return { status: false, message: 'Invalid parameters' }

    const loginResult = await verifyUserPasswd(email, password, 'email')

    if (!loginResult.status)
        return {
            status: false,
            message: loginResult.message || 'Invalid email or password'
        }
    if (!loginResult.data?.user_id) return { status: false, message: 'Internal error' }

    return { status: true, data: { user_id: loginResult.data.user_id } }
}
