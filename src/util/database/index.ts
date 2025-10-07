import { initDatabase } from '@repo/initDatabase'
import MySQL from '@util/database/mysql'
import Redis from '@util/database/redis'
import { logger } from '@util/logger'

export const connTest = async () => {
    try {
        await db.query('SELECT 1')
        logger.info('service/Database', 'Database connection successful')
        await initDatabase()
        logger.info('service/Database', 'Database initialized successfully')
    } catch (error) {
        logger.critical('service/Database', 'Database connection failed:', error)
        // process.exit(1)
    }
}

export const redisTest = async () => {
    try {
        await Redis.getInstance().connection()
        logger.info('service/Database', 'Redis connection successful')
    } catch (error) {
        logger.critical('service/Database', 'Redis connection failed:', error)
        // process.exit(1)
    }
}

export const cache = Redis.getInstance()
export const db = MySQL.getInstance()
