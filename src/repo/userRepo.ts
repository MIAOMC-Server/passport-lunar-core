import { hashPassword } from '@service/passwordService'
import { db } from '@util/database'
import { appConfig } from '@util/getConfig'

const tablePrefix = appConfig('DATABASE_TABLE_PREFIX', 'string')

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

    const user_id = result.data.insertId
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

interface ReadUserInfoReturn {
    status: boolean
    message?: string
    data?: {
        id: number
        email: string
        username: string
        password: string
        global_role: string
        created_at: number
    }
}
export const readUserInfo = async (
    readType: 'id' | 'email' = 'id',
    value: string
): Promise<ReadUserInfoReturn> => {
    let sql: string
    switch (readType) {
        case 'id':
            sql = `SELECT * FROM ${tablePrefix}users WHERE user_id = ?`
            break
        case 'email':
            sql = `SELECT * FROM ${tablePrefix}users WHERE email = ?`
            break
    }

    const result = await db.query(sql, [value])

    if (!result.status || result.data.length === 0) {
        return {
            status: false,
            message: 'User not found'
        }
    }

    const user = result[0]
    return {
        status: true,
        data: {
            id: user.user_id,
            email: user.email,
            username: user.username,
            password: user.password,
            global_role: user.global_role,
            created_at: user.created_at
        }
    }
}
