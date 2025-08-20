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
    try {
        const processedPassword = await hashPassword(password)
        if (!processedPassword.status) {
            return {
                status: false,
                message: 'Failed to hash password'
            }
        }

        const hashedPassword = processedPassword.data
        const sql = `INSERT INTO ${tablePrefix}users (email, username, password, global_role) VALUES (?, ?, ?, ?)`
        const result = await db.query(sql, [
            email.trim().toLowerCase(),
            username.trim(),
            hashedPassword,
            'default'
        ])

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
    } catch (err) {
        if (appConfig('DEBUG', 'boolean')) {
            return { status: false, message: 'internal error: ' + err }
        }
        return { status: false, message: 'Internal Error' }
    }
}

interface checkUserExistsReturn {
    status: boolean
    can_do_next: boolean
    message?: string
    data?: {
        is_email_exists: boolean
        is_username_exists: boolean
    }
}
export const checkUserExists = async (data: {
    email?: string
    username?: string
}): Promise<checkUserExistsReturn> => {
    const email = data.email?.trim().toLowerCase()
    const username = data.username?.trim()

    if (!username && !email) {
        return {
            status: false,
            can_do_next: false,
            message: 'Must provide either email or username'
        }
    }

    const type = email && username ? 'both' : email ? 'email' : 'username'
    const params: (string | undefined)[] = []

    let sql: string

    switch (type) {
        case 'both':
            sql = `SELECT username, email FROM ${tablePrefix}users WHERE email = ? OR username = ?`
            params.push(email!, username!)
            break
        case 'email':
            sql = `SELECT username, email FROM ${tablePrefix}users WHERE email = ?`
            params.push(email!)
            break
        case 'username':
            sql = `SELECT username, email FROM ${tablePrefix}users WHERE username = ?`
            params.push(username!)
            break
    }

    const result = await db.query(sql, params)
    if (result.length === 0) {
        return {
            status: true,
            can_do_next: true,
            data: { is_email_exists: false, is_username_exists: false }
        }
    }

    let is_email_exists = false
    let is_username_exists = false

    for (const user of result) {
        if (user.email === email) {
            is_email_exists = true
        }
        if (user.username === username) {
            is_username_exists = true
        }
    }

    return {
        status: true,
        can_do_next: false,
        data: { is_email_exists, is_username_exists }
    }
}

interface ReadUserInfoReturn {
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
export const readUserInfo = async (
    readType: 'id' | 'username' | 'email' = 'email',
    value: string
): Promise<ReadUserInfoReturn> => {
    let sql: string
    switch (readType) {
        case 'id':
            sql = `SELECT * FROM ${tablePrefix}users WHERE id = ?`
            break
        case 'username':
            sql = `SELECT * FROM ${tablePrefix}users WHERE username = ?`
            break
        case 'email':
            sql = `SELECT * FROM ${tablePrefix}users WHERE email = ?`
            break
    }

    const result = await db.query(sql, [value.trim().toLowerCase()])
    if (result.length !== 1) {
        return {
            status: false,
            message: 'User not found'
        }
    }

    const user = result[0]
    return {
        status: true,
        data: {
            id: user.id,
            email: user.email,
            username: user.username,
            nickname: user.nickname,
            global_role: user.global_role,
            created_at: user.created_at
        }
    }
}

interface ReadUserPasswdReturn {
    status: boolean
    message?: string
    data?: {
        id: number
        password: string
    }
}

export const readUserPasswd = async (
    readType: 'id' | 'username' | 'email',
    value: string
): Promise<ReadUserPasswdReturn> => {
    try {
        let sql: string
        switch (readType) {
            case 'id':
                sql = `SELECT id, password FROM ${tablePrefix}users WHERE id = ?`
                break
            case 'username':
                sql = `SELECT id, password FROM ${tablePrefix}users WHERE username = ?`
                break
            case 'email':
                sql = `SELECT id, password FROM ${tablePrefix}users WHERE email = ?`
                break
        }

        const result = await db.query(sql, [value.trim().toLowerCase()])
        if (result.length !== 1) {
            return {
                status: false,
                message: 'User not found'
            }
        }

        const user = result[0]
        return {
            status: true,
            data: {
                id: user.id,
                password: user.password
            }
        }
    } catch (error) {
        console.error(`Error reading user password:`, error)
        return {
            status: false,
            message: `Failed to read user password`
        }
    }
}
