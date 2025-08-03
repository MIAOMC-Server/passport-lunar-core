import { insertUser } from '@repo/userRepo'

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
