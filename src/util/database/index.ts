import { initDatabase } from '@repo/initDatabase'
import MySQL from '@util/database/mysql'
import Redis from '@util/database/redis'

export const connTest = async () => {
    try {
        await db.query('SELECT 1')
        console.log('Database connection successful')
        await initDatabase()
        console.log('Database initialized successfully')
    } catch (error) {
        console.error('Database connection failed:', error)
        // process.exit(1)
    }
}

export const redisTest = async () => {
    try {
        await Redis.getInstance().connection()
        console.log('Redis connection successful')
    } catch (error) {
        console.error('Redis connection failed:', error)
        // process.exit(1)
    }
}

export const cache = Redis.getInstance()
export const db = MySQL.getInstance()
