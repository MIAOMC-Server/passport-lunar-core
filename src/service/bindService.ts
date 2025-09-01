import { insertPlayer } from '@repo/playerRepo'
import { insertMailVerificationCode, readMailVerificationCode } from '@repo/tokenRepo'
import { insertUser } from '@repo/userRepo'
import { sendVerificationCode } from '@service/mailService'
import { checkEmpty } from '@util/commonUtils'
import { genToken } from '@util/token'

export const BindService = async (
    type: 'newAccount' | 'bindExist',
    step: string,
    data: {
        player_name: string
        player_uuid: string
        email?: string
        password?: string
        code?: string
    }
) => {
    switch (type) {
        case 'newAccount':
            if (step === 'sendCode') {
                if (checkEmpty(data, data.email, data.player_name, data.player_uuid).status) {
                    return { status: false, message: 'All fields are required!' }
                }
                const sendCodeData = {
                    email: data.email as string,
                    player_name: data.player_name as string,
                    player_uuid: data.player_uuid as string
                }
                return await handelNewAccount(step, sendCodeData)
            }
            if (step === 'verifyCode') {
                if (
                    checkEmpty(
                        data,
                        data.email,
                        data.player_name,
                        data.player_uuid,
                        data.password,
                        data.code
                    ).status
                ) {
                    return { status: false, message: 'All fields are required!' }
                }
                const verifyCodeData = {
                    email: data.email as string,
                    player_name: data.player_name as string,
                    player_uuid: data.player_uuid as string,
                    code: data.code as string
                }
                return await handelNewAccount(step, verifyCodeData)
            }
    }
}

export const handelNewAccount = async (
    step: 'sendCode' | 'verifyCode',
    data: {
        email: string
        player_name?: string
        player_uuid: string
        password?: string
        code?: string
    }
) => {
    if (checkEmpty(data, data.email).status) return { status: false, message: 'Email is requierd' }
    switch (step) {
        case 'sendCode': {
            if (!(await sendEmailVerifyCode(data.email)).status)
                return { status: false, message: 'Error when sending verification code' }
            return { status: true, next: 'verifyCode' }
        }

        case 'verifyCode': {
            if (
                checkEmpty(
                    data,
                    data.email,
                    data.password,
                    data.code,
                    data.player_name,
                    data.player_uuid
                ).status
            )
                return { status: false, message: 'All fields are required' }

            const verifyResult = await verifyEmailVerificationCode(data.email, data.code as string)
            if (!verifyResult.status)
                return {
                    status: false,
                    message: verifyResult.message || 'Error to verify verification code'
                }

            const createUserResult = await insertUser(
                data.email,
                data.player_name as string,
                data.password as string
            )

            if (!createUserResult.status || !createUserResult.data?.user_id)
                return {
                    status: false,
                    message: createUserResult.message || 'Error when creating user'
                }

            // 执行玩家插入逻辑
            const newUserId = createUserResult.data.user_id
            const createPlayerResult = await insertPlayer(
                data.player_uuid,
                data.player_name as string,
                newUserId,
                true
            )

            if (!createPlayerResult.status)
                return {
                    status: false,
                    message: createPlayerResult.message || 'Error when creating player'
                }

            return { status: true }
        }
    }
}

interface SendEmailVerificationCodeReturn {
    status: boolean
    message?: string
}

export const sendEmailVerifyCode = async (
    email: string
): Promise<SendEmailVerificationCodeReturn> => {
    const newCode = await genToken(4)

    // 检查验证码生成结果
    if (!newCode.status || !newCode.data?.token)
        return { status: false, message: 'Error when generating verification code' }

    const code = newCode.data.token

    const cacheInsertResult = await insertMailVerificationCode(email, code)
    if (!cacheInsertResult.status) return { status: false, message: 'Faild when inserting code' }

    const sendCodeResult = await sendVerificationCode(email, undefined, newCode.data.token, 5)
    if (!sendCodeResult.status)
        return {
            status: false,
            message: sendCodeResult.message || 'Error when sending verification code'
        }

    return { status: true }
}

interface VerifyEmailVerificationCodeReturn {
    status: boolean
    message?: string
}

export const verifyEmailVerificationCode = async (
    email: string,
    code: string
): Promise<VerifyEmailVerificationCodeReturn> => {
    if (checkEmpty(email, code).status)
        return { status: false, message: 'email and code are required' }

    const readCodeResult = await readMailVerificationCode(code)
    if (!readCodeResult.status || !readCodeResult.data?.email)
        return { status: false, message: 'Error when getting mail verification code' }

    if (email !== readCodeResult.data.email) return { status: false, message: 'Invalid code' }

    return { status: true }
}
