import { appConfig } from '@util/getConfig'
import bcrypt from 'bcrypt'

interface HashPasswordReturn {
    status: boolean
    message?: string
    data?: string
}
export const hashPassword = async (plain_passwd: string): Promise<HashPasswordReturn> => {
    try {
        const saltRounds = appConfig('SALT_ROUNDS', 'number')
        const hashedPassword = await bcrypt.hash(plain_passwd, saltRounds as number)
        return {
            status: true,
            data: hashedPassword
        }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            console.error('Error hashing password:', error)
            return {
                status: false,
                message: `Error hashing password: ${error}`
            }
        }
        return {
            status: false,
            message: 'Failed to hash password'
        }
    }
}

interface ComparePasswordReturn {
    status: boolean
    message?: string
}

export const comparePassword = async (
    plain_passwd: string,
    hashed_passwd: string
): Promise<ComparePasswordReturn> => {
    try {
        const isMatch = await bcrypt.compare(plain_passwd, hashed_passwd)

        if (appConfig('DEBUG', 'boolean')) {
            console.log('Comparing passwords:', {
                plainLength: plain_passwd.length,
                hashedLength: hashed_passwd.length,
                hashedStart: hashed_passwd.substring(0, 10)
            })
            console.log('Password comparison result:', isMatch)
        }

        return {
            status: isMatch
        }
    } catch (error) {
        if (appConfig('DEBUG', 'boolean')) {
            console.error('Error comparing passwords:', error)
            return {
                status: false,
                message: `Error comparing passwords: ${error}`
            }
        }
        return {
            status: false,
            message: 'Failed to compare passwords'
        }
    }
}
