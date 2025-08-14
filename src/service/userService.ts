import { insertUser, readUserInfo } from '@repo/userRepo'

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
        console.error(`Error creating user:`, error)
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
        global_role: string
        created_at: number
    }
}
export const getUser = async (getType: 'id' | 'email', value: string): Promise<GetUserReturn> => {
    try {
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
                global_role: userInfo.data.global_role,
                created_at: userInfo.data.created_at
            }
        }
    } catch (error) {
        console.error(`Error getting user:`, error)
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
export const getUserPasswd = async (id: string): Promise<GetUserPasswdReturn> => {
    try {
        const userInfo = await readUserInfo('id', id)

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
        console.error(`Error getting user password:`, error)
        return {
            status: false,
            message: `Failed to get user password`
        }
    }
}
