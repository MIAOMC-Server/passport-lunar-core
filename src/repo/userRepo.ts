import { hashPassword } from '@service/passwordService'
import { db } from '@util/database'
import { appConfig } from '@util/getConfig'

const tablePrefix = appConfig('APP_DATABASE_TABLE_PREFIX', 'string')

// Start User Oprations
interface InsertUserReturn {
    status: boolean
    message?: string
    data?: {
        user_id: number
    }
}

export const insertUser = async (
    email: string,
    username: string,
    password: string
): Promise<InsertUserReturn> => {
    const processedPassword = (await hashPassword(password)).data

    const sql = `INSERT INTO ${tablePrefix}users (email, username, password, global_role) VALUES (?, ?, ?, ?)`
    const result = await db.query(sql, [email, username, processedPassword, 'default'])

    const user_id = result.insertId
    if (!user_id) {
        return {
            status: false,
            message: 'Failed to insert user'
        }
    }

    return {
        status: true,
        data: { user_id }
    }
}
